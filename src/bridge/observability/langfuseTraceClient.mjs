import { createHash } from 'node:crypto';
/**
 * Hash identifiers deterministically so trace retries reuse the same IDs.
 *
 * @param {string} value Identifier to hash.
 * @returns {string} SHA-256 digest in hexadecimal.
 */
const hash = (value) => createHash('sha256').update(value).digest('hex');
/**
 * Derive a stable 128-bit trace ID from a request identifier.
 *
 * @param {string} id Request identifier.
 * @returns {string} OpenTelemetry trace ID in hexadecimal.
 */
export const traceIdFor = (id) => hash(id).slice(0, 32);
/**
 * Encode a value as an OpenTelemetry string attribute.
 *
 * @param {string} key Attribute name.
 * @param {unknown} value String or JSON-serializable value.
 * @returns {{ key: string, value: { stringValue: string } }}
 */
const attribute = (key, value) => ({
  key,
  value: { stringValue: typeof value === 'string' ? value : JSON.stringify(value) },
});
// OTLP HTTP/JSON allows deterministic span IDs and durable replay without redoing inference.
// https://langfuse.com/integrations/native/opentelemetry
/**
 * Build a replayable OTLP batch, separating cached token usage from input usage.
 *
 * @param {import('../execution/taskContract.mjs').TaskRecord} record Finished task record.
 * @returns {object} OTLP HTTP/JSON payload for Langfuse.
 */
export function buildLangfuseTraceBatch(record) {
  const metadata = {
    requestId: record.requestId,
    provider: record.provider,
    model: record.model,
    status: record.status,
    durationMs: record.durationMs,
    providerRequestId: record.providerRequestId,
  };
  const providerUsage = record.usage;
  const usageDetails = providerUsage
    ? {
        input: Math.max(0, providerUsage.input - (providerUsage.cachedInput ?? 0)),
        output: providerUsage.output,
        ...(providerUsage.cachedInput !== undefined ? { input_cached: providerUsage.cachedInput } : {}),
      }
    : undefined;
  const attributes = [
    attribute('langfuse.trace.name', 'local-ai-workflow'),
    attribute('langfuse.observation.type', 'generation'),
    attribute('langfuse.observation.input', JSON.stringify(record.prompt)),
    attribute('langfuse.observation.output', JSON.stringify(record.text ?? null)),
    // Namespace subscription models to prevent API-price estimates being presented as plan billing.
    attribute(
      'langfuse.observation.model.name',
      record.provider === 'codex' ? `codex/${record.model}` : record.model,
    ),
    attribute('langfuse.observation.level', record.status === 'completed' ? 'DEFAULT' : 'ERROR'),
    attribute('langfuse.observation.status_message', record.error?.message ?? record.status),
    ...Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => attribute(`langfuse.observation.metadata.${key}`, value)),
  ];
  if (usageDetails) {
    attributes.push(attribute('langfuse.observation.usage_details', usageDetails));
  }
  return {
    resourceSpans: [
      {
        resource: { attributes: [attribute('service.name', 'agent-workflows-local-ai')] },
        scopeSpans: [
          {
            scope: { name: 'local-ai', version: '1' },
            spans: [
              {
                traceId: record.traceId,
                spanId: hash(`${record.traceId}:generation`).slice(0, 16),
                name: 'inference',
                kind: 1,
                startTimeUnixNano: String(BigInt(Date.parse(record.startedAt)) * 1000000n),
                endTimeUnixNano: String(BigInt(Date.parse(record.endedAt)) * 1000000n),
                status: {
                  code: record.status === 'completed' ? 1 : 2,
                  message: record.error?.message ?? '',
                },
                attributes,
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Create a trace sender; retries are coordinated by task execution.
 *
 * @param {object} options
 * @param {string} options.url Langfuse base URL.
 * @param {string} options.publicKey Project public key.
 * @param {string} options.secretKey Project secret key.
 * @param {typeof fetch} [options.fetchImpl=fetch] Injectable HTTP client.
 * @returns {function(import('../execution/taskContract.mjs').TaskRecord): Promise<void>} Sender that rejects failed or partially accepted deliveries.
 */
export function createLangfuseTraceClient({ url, publicKey, secretKey, fetchImpl = fetch }) {
  return async (record) => {
    const response = await fetchImpl(`${url}/api/public/otel/v1/traces`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: {
        'Content-Type': 'application/json',
        'x-langfuse-ingestion-version': '4',
        Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString('base64')}`,
      },
      body: JSON.stringify(buildLangfuseTraceBatch(record)),
    });
    if (!response.ok) {
      throw new Error('Trace delivery failed');
    }
    const result = await response.json();
    if (
      Number(result.partialSuccess?.rejectedSpans ?? 0) > 0 ||
      result.partialSuccess?.errorMessage
    ) {
      throw new Error('Trace span was not fully accepted');
    }
  };
}
