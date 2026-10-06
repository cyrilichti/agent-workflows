import { randomBytes } from 'node:crypto';
import { ProviderError, validateTaskInput, validateTaskResult } from './task-contract.mjs';

/** Coordinate one inference at a time and attempt its trace once. */
export class TaskExecutionService {
  /**
   * @param {object} options
   * @param {import('./task-contract.mjs').AiProvider} options.provider Inference adapter.
   * @param {string} options.providerName Provider identifier.
   * @param {string} options.model Model label used in the response and trace.
   * @param {function(import('./task-contract.mjs').TaskOutcome): Promise<void>} options.trace Trace sender.
   * @param {string} options.publicUrl Public Langfuse URL.
   * @param {string} options.projectId Langfuse project identifier.
   * @param {boolean} options.enabled Whether new inference is allowed.
   * @param {number} [options.timeoutMs=1800000] Inference deadline in milliseconds.
   */
  constructor({ provider, providerName, model, trace, publicUrl, projectId, enabled, timeoutMs = 1800000 }) {
    Object.assign(this, { provider, providerName, model, trace, publicUrl, projectId, enabled, timeoutMs });
    this.busy = false;
  }

  /**
   * Expose the result without its prompt.
   * @param {import('./task-contract.mjs').TaskOutcome} outcome Finished task.
   * @returns {object} HTTP response payload with a public trace link.
   */
  presentTaskResult(outcome) {
    return {
      requestId: outcome.requestId,
      provider: outcome.provider,
      model: outcome.model,
      status: outcome.status,
      text: outcome.text ?? null,
      error: outcome.error ?? null,
      usage: outcome.usage ?? null,
      durationMs: outcome.durationMs ?? null,
      providerRequestId: outcome.providerRequestId ?? null,
      traceId: outcome.traceId,
      traceStatus: outcome.traceStatus,
      traceUrl: `${this.publicUrl}/project/${this.projectId}/traces/${outcome.traceId}`,
    };
  }

  /** Request cancellation of the active provider call, if any. */
  cancelActiveTask() {
    this.controller?.abort();
  }

  /**
   * Run one inference for each accepted call, then attempt trace delivery once.
   * @param {unknown} body Untrusted task input.
   * @returns {Promise<object>} Public result, including execution and trace status.
   * @throws {ProviderError} For invalid input, disabled or busy execution.
   */
  async executeTask(body) {
    const { prompt, requestId, directory, timeoutMs = this.timeoutMs } = validateTaskInput(body);
    if (!this.enabled) {
      throw new ProviderError(
        'disabled',
        'Inference disabled. Verify credentials and usage controls before enabling it.',
      );
    }
    if (this.busy) {
      throw new ProviderError('busy', 'One inference is already running. Try again later.');
    }
    const outcome = {
      requestId,
      prompt,
      provider: this.providerName,
      model: this.model,
      status: 'running',
      traceId: randomBytes(16).toString('hex'),
      startedAt: new Date().toISOString(),
    };
    this.busy = true;
    this.controller = new AbortController();
    try {
      try {
        const result = validateTaskResult(
          await this.provider.generate(prompt, {
            signal: AbortSignal.any([this.controller.signal, AbortSignal.timeout(timeoutMs)]),
            ...(directory !== undefined ? { directory } : {}),
          }),
        );
        Object.assign(outcome, {
          status: 'completed',
          text: result.text,
          model: result.model,
          usage: result.usage,
          providerRequestId: result.requestId,
        });
      } catch (error) {
        outcome.status = ['timeout', 'network'].includes(error.code) ? 'unknown' : 'failed';
        outcome.error = {
          code: error instanceof ProviderError ? error.code : 'provider_error',
          message:
            error instanceof ProviderError ? error.message : 'Provider failed; no automatic retry.',
        };
      }
      outcome.endedAt = new Date().toISOString();
      outcome.durationMs = Date.parse(outcome.endedAt) - Date.parse(outcome.startedAt);
    } finally {
      this.busy = false;
      this.controller = null;
    }
    try {
      await this.trace(outcome);
      outcome.traceStatus = 'accepted';
    } catch {
      outcome.traceStatus = 'failed';
    }
    return this.presentTaskResult(outcome);
  }
}
