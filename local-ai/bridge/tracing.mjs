import { createHash } from 'node:crypto';
const hash = value => createHash('sha256').update(value).digest('hex');
export const traceIdFor = id => hash(id).slice(0, 32);
const attribute = (key, value) => ({ key, value: { stringValue: typeof value === 'string' ? value : JSON.stringify(value) } });
// OTLP HTTP/JSON allows deterministic span IDs and durable replay without redoing inference.
// https://langfuse.com/integrations/native/opentelemetry
export function traceBatch(record) {
  const metadata = { requestId: record.requestId, provider: record.provider, model: record.model,
    status: record.status, durationMs: record.durationMs, providerRequestId: record.providerRequestId };
  const u = record.usage;
  const usageDetails = u ? { input: Math.max(0, u.input - (u.cachedInput ?? 0)), output: u.output,
    ...(u.cachedInput !== undefined ? { input_cached: u.cachedInput } : {}) } : undefined;
  const attributes = [attribute('langfuse.trace.name', 'local-ai-workflow'),
    attribute('langfuse.observation.type', 'generation'),
    attribute('langfuse.observation.input', JSON.stringify(record.prompt)),
    attribute('langfuse.observation.output', JSON.stringify(record.text ?? null)),
    // Namespace subscription models to prevent API-price estimates being presented as plan billing.
    attribute('langfuse.observation.model.name', record.provider === 'codex' ? `codex/${record.model}` : record.model),
    attribute('langfuse.observation.level', record.status === 'completed' ? 'DEFAULT' : 'ERROR'),
    attribute('langfuse.observation.status_message', record.error?.message ?? record.status),
    ...Object.entries(metadata).filter(([,v]) => v !== undefined).map(([k,v]) => attribute(`langfuse.observation.metadata.${k}`, v))];
  if (usageDetails) attributes.push(attribute('langfuse.observation.usage_details', usageDetails));
  return { resourceSpans: [{ resource: { attributes: [attribute('service.name', 'agent-workflows-local-ai')] },
    scopeSpans: [{ scope: { name: 'local-ai', version: '1' }, spans: [{
      traceId: record.traceId, spanId: hash(`${record.traceId}:generation`).slice(0, 16), name: 'inference', kind: 1,
      startTimeUnixNano: String(BigInt(Date.parse(record.startedAt)) * 1000000n),
      endTimeUnixNano: String(BigInt(Date.parse(record.endedAt)) * 1000000n),
      status: { code: record.status === 'completed' ? 1 : 2, message: record.error?.message ?? '' }, attributes
    }] }] }] };
}
export function createTracer({ url, publicKey, secretKey, fetchImpl = fetch }) {
  return async record => {
    const response = await fetchImpl(`${url}/api/public/otel/v1/traces`, {
      method: 'POST', signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json', 'x-langfuse-ingestion-version': '4',
        Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString('base64')}` },
      body: JSON.stringify(traceBatch(record))
    });
    if (!response.ok) throw new Error('Trace delivery failed');
    const result = await response.json();
    if (Number(result.partialSuccess?.rejectedSpans ?? 0) > 0 || result.partialSuccess?.errorMessage)
      throw new Error('Trace span was not fully accepted');
  };
}
