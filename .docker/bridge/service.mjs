import { createHash } from 'node:crypto';
import { ProviderError, validateInput, validateResult } from './contract.mjs';
import { traceIdFor } from './tracing.mjs';
const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export class Service {
  constructor({ provider, providerName, model, store, trace, publicUrl, projectId, enabled, timeoutMs = 90000 }) {
    Object.assign(this, { provider, providerName, model, store, trace, publicUrl, projectId, enabled, timeoutMs });
    this.busy = false; this.flushing = false; this.deliveries = new Map();
    for (const record of store.all()) if (record.status === 'running') {
      record.status = 'unknown'; record.endedAt = new Date().toISOString();
      record.durationMs = Date.parse(record.endedAt) - Date.parse(record.startedAt);
      record.error = { code: 'interrupted', message: 'Service restarted during inference. Remote outcome unknown; no automatic retry.' };
      store.put(record);
    }
  }
  present(record) {
    return { requestId: record.requestId, provider: record.provider, model: record.model, status: record.status,
      text: record.text ?? null, error: record.error ?? null, usage: record.usage ?? null,
      durationMs: record.durationMs ?? null, providerRequestId: record.providerRequestId ?? null,
      traceId: record.traceId, traceStatus: record.traceStatus,
      traceUrl: `${this.publicUrl}/project/${this.projectId}/traces/${record.traceId}` };
  }
  async deliver(record) {
    if (record.traceStatus === 'accepted' || record.status === 'running') return;
    const id = record.requestId;
    if (!this.deliveries.has(id)) {
      const delivery = (async () => {
        const current = this.store.get(id);
        if (current.traceStatus === 'accepted') return;
        try { await this.trace(current); current.traceStatus = 'accepted'; }
        catch { current.traceStatus = 'pending'; }
        this.store.put(current);
      })();
      this.deliveries.set(id, delivery);
      delivery.finally(() => this.deliveries.delete(id)).catch(() => {});
    }
    await this.deliveries.get(id);
    record.traceStatus = this.store.get(id).traceStatus;
  }
  async flush() {
    if (this.flushing) return;
    this.flushing = true;
    try { for (const record of this.store.all()) await this.deliver(record); }
    finally { this.flushing = false; }
  }
  async run(body) {
    const { prompt, requestId } = validateInput(body);
    const digest = fingerprint({ prompt, provider: this.providerName, model: this.model });
    const existing = this.store.get(requestId);
    if (existing) {
      if (existing.fingerprint !== digest) throw new ProviderError('conflict', 'This requestId belongs to different input or provider settings.');
      await this.deliver(existing);
      return this.present(existing);
    }
    if (!this.enabled) throw new ProviderError('disabled', 'Inference disabled. Verify credentials and usage controls before enabling it.');
    if (this.busy) throw new ProviderError('busy', 'One inference is already running. Retry this request ID later.');
    this.busy = true;
    const record = { requestId, prompt, fingerprint: digest, provider: this.providerName, model: this.model,
      status: 'running', traceStatus: 'pending', traceId: traceIdFor(requestId), startedAt: new Date().toISOString() };
    try {
      this.store.put(record);
      try {
        const result = validateResult(await this.provider.generate(prompt, { signal: AbortSignal.timeout(this.timeoutMs) }));
        Object.assign(record, { status: 'completed', text: result.text, model: result.model,
          usage: result.usage, providerRequestId: result.requestId });
      } catch (error) {
        record.status = ['timeout', 'network'].includes(error.code) ? 'unknown' : 'failed';
        record.error = { code: error instanceof ProviderError ? error.code : 'provider_error',
          message: error instanceof ProviderError ? error.message : 'Provider failed; no automatic retry.' };
      }
      record.endedAt = new Date().toISOString();
      record.durationMs = Date.parse(record.endedAt) - Date.parse(record.startedAt);
      this.store.put(record);
      await this.deliver(record);
      return this.present(record);
    } finally { this.busy = false; }
  }
}
