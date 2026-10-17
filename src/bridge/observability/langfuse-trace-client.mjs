import { createHash } from 'node:crypto';
/** Hash an identifier for its OpenTelemetry span ID. */
const hash = (value) => createHash('sha256').update(value).digest('hex');
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
const stringArrayAttribute = (key, values) => ({
  key,
  value: { arrayValue: { values: values.map((value) => ({ stringValue: value })) } },
});
// https://langfuse.com/integrations/native/opentelemetry
/**
 * Build an OTLP batch, separating cached token usage from input usage.
 *
 * @param {import('../execution/task-contract.mjs').TaskOutcome} record Finished task outcome.
 * @param {{ environment?: string }} [options] Trace environment.
 * @returns {object} OTLP HTTP/JSON payload for Langfuse.
 */
export function buildLangfuseTraceBatch(record, { environment } = {}) {
  const summary = record.provider === 'codex' && record.codexSummary?.traceId === record.traceId
    ? record.codexSummary : undefined;
  const metadata = {
    requestId: record.requestId,
    provider: record.provider,
    model: record.model,
    status: record.status,
    durationMs: record.durationMs,
    providerRequestId: record.providerRequestId,
    ...(summary ? {
      summarySchemaVersion: summary.schemaVersion,
      phase: summary.phase,
      threadId: summary.threadId,
      promptCharacters: summary.promptCharacters,
      jsonlBytes: summary.jsonlBytes,
      codexUsage: summary.usage,
      eventCounts: summary.eventCounts,
      malformedLines: summary.malformedLines,
      measurementNote: summary.measurementNote,
    } : {}),
  };
  const providerUsage = record.usage;
  const usageDetails = providerUsage
    ? {
        input: Math.max(0, providerUsage.input - (providerUsage.cachedInput ?? 0)),
        output: providerUsage.output,
        ...(providerUsage.cachedInput !== undefined ? { input_cached: providerUsage.cachedInput } : {}),
      }
    : undefined;
  const traceAttributes = [
    ...(record.trace ? [attribute('langfuse.trace.name', record.trace.name)] : []),
    ...(record.trace?.tags.length ? [stringArrayAttribute('langfuse.trace.tags', record.trace.tags)] : []),
    ...(environment ? [attribute('langfuse.environment', environment)] : []),
  ];
  const attributes = [
    ...traceAttributes,
    attribute('langfuse.observation.type', 'generation'),
    attribute('langfuse.observation.input', JSON.stringify(record.prompt)),
    attribute('langfuse.observation.output', JSON.stringify(record.text ?? null)),
    // Namespace subscription models to prevent API-price estimates being presented as plan billing.
    attribute(
      'langfuse.observation.model.name',
      record.provider === 'codex' ? `codex/${record.model}` : record.model,
    ),
    attribute('langfuse.observation.level', record.status === 'completed' ? record.trace?.level ?? 'DEFAULT' : 'ERROR'),
    attribute('langfuse.observation.status_message', record.error?.message ?? record.status),
    ...Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => attribute(`langfuse.observation.metadata.${key}`, value)),
  ];
  if (usageDetails) {
    attributes.push(attribute('langfuse.observation.usage_details', usageDetails));
  }
  const rootSpanId = hash(`${record.traceId}:generation`).slice(0, 16);
  const startTimeMs = Date.parse(record.startedAt);
  const endTimeMs = Date.parse(record.endedAt);
  const endTimeUnixNano = String(BigInt(endTimeMs) * 1000000n);
  const items = summary?.items ?? [];
  let commandIndex = 0;
  const itemSpans = items.map((item, index) => {
    const isCommand = item.type === 'command_execution';
    if (isCommand) commandIndex++;
    const size = `${item.inputCharacters ?? 0} in, ${item.outputCharacters ?? 0} out chars`;
    const receivedAtMs = Date.parse(item.completedAt);
    const hasMeasuredTime = Number.isFinite(receivedAtMs) && receivedAtMs >= startTimeMs && receivedAtMs <= endTimeMs;
    const itemTimeUnixNano = String(BigInt(hasMeasuredTime ? receivedAtMs : endTimeMs) * 1000000n);
    return {
      traceId: record.traceId,
      spanId: hash(`${record.traceId}:item:${index}:${item.id ?? ''}`).slice(0, 16),
      parentSpanId: rootSpanId,
      name: isCommand
        ? `command ${commandIndex}: ${item.commandName ?? 'shell'} (${size})`
        : `item ${index + 1}: ${item.type ?? 'unknown'} (${size})`,
      kind: 1,
      startTimeUnixNano: itemTimeUnixNano,
      endTimeUnixNano: itemTimeUnixNano,
      status: { code: item.exitCode === 0 ? 1 : item.exitCode === undefined ? 0 : 2 },
      attributes: [
        ...traceAttributes,
        attribute('langfuse.observation.type', 'event'),
        attribute('langfuse.observation.metadata.sequence', index + 1),
        attribute('langfuse.observation.metadata.timeSource', hasMeasuredTime ? 'bridge received item completion' : 'unavailable'),
        attribute('langfuse.observation.metadata.itemType', item.type ?? 'unknown'),
        attribute('langfuse.observation.metadata.inputCharacters', item.inputCharacters ?? 0),
        attribute('langfuse.observation.metadata.outputCharacters', item.outputCharacters ?? 0),
        ...(item.exitCode === undefined ? [] : [attribute('langfuse.observation.metadata.exitCode', item.exitCode)]),
        ...(item.tool ? [attribute('langfuse.observation.metadata.tool', item.tool)] : []),
        attribute('langfuse.observation.metadata.measurement', 'characters; token usage is recorded on the run'),
        ...(item.exitCode !== undefined && item.exitCode !== 0
          ? [attribute('langfuse.observation.level', 'ERROR')] : []),
      ],
    };
  });
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
                spanId: rootSpanId,
                name: record.trace?.observationName ?? 'inference',
                kind: 1,
                startTimeUnixNano: String(BigInt(startTimeMs) * 1000000n),
                endTimeUnixNano,
                status: {
                  code: record.status === 'completed' ? 1 : 2,
                  message: record.error?.message ?? '',
                },
                attributes,
              },
              ...itemSpans,
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Create a trace sender for one delivery attempt.
 *
 * @param {object} options
 * @param {string} options.url Langfuse base URL.
 * @param {string} options.publicKey Project public key.
 * @param {string} options.secretKey Project secret key.
 * @param {string} [options.environment] Environment attached to every trace.
 * @param {typeof fetch} [options.fetchImpl=fetch] Injectable HTTP client.
 * @returns {function(import('../execution/task-contract.mjs').TaskOutcome): Promise<void>} Sender that rejects failed or partially accepted deliveries.
 */
export function createLangfuseTraceClient({ url, publicKey, secretKey, environment, fetchImpl = fetch }) {
  return async (record) => {
    const response = await fetchImpl(`${url}/api/public/otel/v1/traces`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: {
        'Content-Type': 'application/json',
        'x-langfuse-ingestion-version': '4',
        Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString('base64')}`,
      },
      body: JSON.stringify(buildLangfuseTraceBatch(record, { environment })),
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
