import { spanId, traceAttribute, unixNanoseconds } from '../helper.ts';
import type { TaskOutcome } from '../types/task.types.ts';
import type { CodexSummary, TraceAttribute, TraceSpan } from '../types/trace.types.ts';
import { TraceGenerationMetadataBuilder } from './trace-generation-metadata.builder.ts';

export class TraceGenerationBuilder {
  private readonly metadata = new TraceGenerationMetadataBuilder();

  build(record: TaskOutcome, summary: CodexSummary | undefined, shared: TraceAttribute[]): TraceSpan {
    const attributes = [
      ...shared,
      traceAttribute('langfuse.observation.type', 'generation'),
      traceAttribute('langfuse.observation.input', JSON.stringify(record.prompt)),
      traceAttribute('langfuse.observation.output', JSON.stringify(record.text ?? null)),
      traceAttribute('langfuse.observation.model.name', record.provider === 'codex' ? `codex/${record.model}` : record.model),
      traceAttribute('langfuse.observation.level', record.status === 'completed' ? record.trace?.level ?? 'DEFAULT' : 'ERROR'),
      traceAttribute('langfuse.observation.status_message', record.error?.message ?? record.status),
      ...Object.entries(this.metadata.build(record, summary))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => traceAttribute(`langfuse.observation.metadata.${key}`, value)),
    ];
    const usage = this.metadata.usageDetails(record);
    if (usage) attributes.push(traceAttribute('langfuse.observation.usage_details', usage));
    return {
      traceId: record.traceId,
      spanId: spanId(`${record.traceId}:generation`),
      name: record.trace?.observationName ?? 'inference',
      kind: 1,
      startTimeUnixNano: unixNanoseconds(Date.parse(record.startedAt)),
      endTimeUnixNano: unixNanoseconds(Date.parse(record.endedAt ?? record.startedAt)),
      status: { code: record.status === 'completed' ? 1 : 2, message: record.error?.message ?? '' },
      attributes,
    };
  }
}
