import { createHash } from 'node:crypto';
import { ProviderError, validateTaskInput, validateTaskResult } from './task-contract.mjs';
import { traceIdFor } from '../observability/langfuse-trace-client.mjs';

/**
 * Bind an idempotency key to its original input and provider settings.
 * @param {object} value JSON-serializable execution settings.
 * @returns {string} SHA-256 digest.
 */
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Coordinate one inference at a time with durable results and trace retries. */
export class TaskExecutionService {
  /**
   * Recover interrupted tasks without replaying inference.
   * @param {object} options
   * @param {import('./task-contract.mjs').AiProvider} options.provider Inference adapter.
   * @param {string} options.providerName Provider identifier.
   * @param {string} options.model Model label used for idempotency.
   * @param {import('../persistence/task-record-store.mjs').TaskRecordStore} options.store Durable storage.
   * @param {function(import('./task-contract.mjs').TaskRecord): Promise<void>} options.trace Trace sender.
   * @param {string} options.publicUrl Public Langfuse URL.
   * @param {string} options.projectId Langfuse project identifier.
   * @param {boolean} options.enabled Whether new inference is allowed.
   * @param {number} [options.timeoutMs=1800000] Inference deadline in milliseconds.
   * @throws {Error} If recovery cannot read or persist task records.
   */
  constructor({
    provider,
    providerName,
    model,
    store,
    trace,
    publicUrl,
    projectId,
    enabled,
    timeoutMs = 1800000,
  }) {
    Object.assign(this, {
      provider,
      providerName,
      model,
      store,
      trace,
      publicUrl,
      projectId,
      enabled,
      timeoutMs,
    });
    this.busy = false;
    this.flushing = false;
    this.deliveries = new Map();
    for (const record of store.all()) {
      if (record.status === 'running') {
        record.status = 'unknown';
        record.endedAt = new Date().toISOString();
        record.durationMs = Date.parse(record.endedAt) - Date.parse(record.startedAt);
        record.error = {
          code: 'interrupted',
          message:
            'Service restarted during inference. Remote outcome unknown; no automatic retry.',
        };
        store.put(record);
      }
    }
  }

  /**
   * Expose the result without internal input or idempotency metadata.
   * @param {import('./task-contract.mjs').TaskRecord} record Saved task state.
   * @returns {object} HTTP response payload with a public trace link.
   */
  presentTaskResult(record) {
    return {
      requestId: record.requestId,
      provider: record.provider,
      model: record.model,
      status: record.status,
      text: record.text ?? null,
      error: record.error ?? null,
      usage: record.usage ?? null,
      durationMs: record.durationMs ?? null,
      providerRequestId: record.providerRequestId ?? null,
      traceId: record.traceId,
      traceStatus: record.traceStatus,
      traceUrl: `${this.publicUrl}/project/${this.projectId}/traces/${record.traceId}`,
    };
  }

  /**
   * Share concurrent delivery attempts and leave rejected traces pending for retry.
   * @param {import('./task-contract.mjs').TaskRecord} record Updated with delivery status.
   * @returns {Promise<void>}
   * @throws {Error} If reading or persisting delivery state fails.
   */
  async deliverTrace(record) {
    if (record.traceStatus === 'accepted' || record.status === 'running') {
      return;
    }
    const id = record.requestId;
    if (!this.deliveries.has(id)) {
      const delivery = (async () => {
        const current = this.store.get(id);
        if (current.traceStatus === 'accepted') {
          return;
        }
        try {
          await this.trace(current);
          current.traceStatus = 'accepted';
        } catch {
          current.traceStatus = 'pending';
        }
        this.store.put(current);
      })();
      this.deliveries.set(id, delivery);
      delivery.finally(() => this.deliveries.delete(id)).catch(() => {
        // The caller awaits the original delivery; handle only the cleanup promise here.
      });
    }
    await this.deliveries.get(id);
    record.traceStatus = this.store.get(id).traceStatus;
  }

  /**
   * Retry stored traces sequentially; overlapping flushes are skipped.
   * @returns {Promise<void>}
   * @throws {Error} If task storage cannot be accessed.
   */
  async flushPendingTraces() {
    if (this.flushing) {
      return;
    }
    this.flushing = true;
    try {
      for (const record of this.store.all()) {
        await this.deliverTrace(record);
      }
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Request cancellation of the active provider call, if any.
   * @returns {void}
   */
  cancelActiveTask() {
    this.controller?.abort();
  }

  /**
   * Reuse a saved result or persist and attempt a new task at most once locally.
   * Provider failures are recorded; an unknown remote outcome is never retried.
   * @param {unknown} body Untrusted task input.
   * @returns {Promise<object>} Public result, including execution and trace status.
   * @throws {ProviderError} For invalid input, conflicting IDs, disabled or busy execution.
   * @throws {Error} If task state cannot be read or persisted.
   */
  async executeTask(body) {
    const { prompt, requestId } = validateTaskInput(body);
    const digest = fingerprint({ prompt, provider: this.providerName, model: this.model });
    const existing = this.store.get(requestId);
    if (existing) {
      if (existing.fingerprint !== digest) {
        throw new ProviderError(
          'conflict',
          'This requestId belongs to different input or provider settings.',
        );
      }
      await this.deliverTrace(existing);
      return this.presentTaskResult(existing);
    }
    if (!this.enabled) {
      throw new ProviderError(
        'disabled',
        'Inference disabled. Verify credentials and usage controls before enabling it.',
      );
    }
    if (this.busy) {
      throw new ProviderError(
        'busy',
        'One inference is already running. Retry this request ID later.',
      );
    }
    this.busy = true;
    this.controller = new AbortController();
    const record = {
      requestId,
      prompt,
      fingerprint: digest,
      provider: this.providerName,
      model: this.model,
      status: 'running',
      traceStatus: 'pending',
      traceId: traceIdFor(requestId),
      startedAt: new Date().toISOString(),
    };
    try {
      this.store.put(record);
      try {
        const result = validateTaskResult(
          await this.provider.generate(prompt, {
            signal: AbortSignal.any([this.controller.signal, AbortSignal.timeout(this.timeoutMs)]),
          }),
        );
        Object.assign(record, {
          status: 'completed',
          text: result.text,
          model: result.model,
          usage: result.usage,
          providerRequestId: result.requestId,
        });
      } catch (error) {
        record.status = ['timeout', 'network'].includes(error.code) ? 'unknown' : 'failed';
        record.error = {
          code: error instanceof ProviderError ? error.code : 'provider_error',
          message:
            error instanceof ProviderError ? error.message : 'Provider failed; no automatic retry.',
        };
      }
      record.endedAt = new Date().toISOString();
      record.durationMs = Date.parse(record.endedAt) - Date.parse(record.startedAt);
      this.store.put(record);
      await this.deliverTrace(record);
      return this.presentTaskResult(record);
    } finally {
      this.busy = false;
      this.controller = null;
    }
  }
}
