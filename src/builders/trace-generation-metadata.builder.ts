import type { TaskOutcome } from '../types/task.types.ts';
import type { CodexSummary } from '../types/trace.types.ts';

export class TraceGenerationMetadataBuilder {
  build(record: TaskOutcome, summary?: CodexSummary) {
    return {
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
  }

  usageDetails(record: TaskOutcome) {
    if (!record.usage) return undefined;
    return {
      input: Math.max(0, record.usage.input - (record.usage.cachedInput ?? 0)),
      output: record.usage.output,
      ...(record.usage.cachedInput !== undefined ? { input_cached: record.usage.cachedInput } : {}),
    };
  }
}
