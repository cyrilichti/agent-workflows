import { spanId, traceAttribute, unixNanoseconds } from '../helper.ts';
import { TraceItemEntity } from '../entities/trace-item.entity.ts';
import type { TaskOutcome } from '../types/task.types.ts';
import type { TraceAttribute, TraceSpan } from '../types/trace.types.ts';

export class TraceItemSpanBuilder {
  build(record: TaskOutcome, item: TraceItemEntity, shared: TraceAttribute[], parentSpanId: string): TraceSpan {
    const { event, index, commandIndex } = item;
    const start = Date.parse(record.startedAt);
    const end = Date.parse(record.endedAt ?? record.startedAt);
    const received = Date.parse(event.completedAt ?? '');
    const measured = Number.isFinite(received) && received >= start && received <= end;
    const time = unixNanoseconds(measured ? received : end);
    const size = `${event.inputCharacters ?? 0} in, ${event.outputCharacters ?? 0} out chars`;
    const name = event.type === 'command_execution'
      ? `command ${commandIndex}: ${event.commandName ?? 'shell'} (${size})`
      : `item ${index + 1}: ${event.type ?? 'unknown'} (${size})`;
    const attributes = [
      ...shared,
      traceAttribute('langfuse.observation.type', 'event'),
      traceAttribute('langfuse.observation.metadata.sequence', index + 1),
      traceAttribute('langfuse.observation.metadata.timeSource', measured ? 'bridge received item completion' : 'unavailable'),
      traceAttribute('langfuse.observation.metadata.itemType', event.type ?? 'unknown'),
      traceAttribute('langfuse.observation.metadata.inputCharacters', event.inputCharacters ?? 0),
      traceAttribute('langfuse.observation.metadata.outputCharacters', event.outputCharacters ?? 0),
      ...(event.exitCode === undefined ? [] : [traceAttribute('langfuse.observation.metadata.exitCode', event.exitCode)]),
      ...(event.tool ? [traceAttribute('langfuse.observation.metadata.tool', event.tool)] : []),
      traceAttribute('langfuse.observation.metadata.measurement', 'characters; token usage is recorded on the run'),
      ...(event.exitCode !== undefined && event.exitCode !== 0 ? [traceAttribute('langfuse.observation.level', 'ERROR')] : []),
    ];
    return {
      traceId: record.traceId,
      spanId: spanId(`${record.traceId}:item:${index}:${event.id ?? ''}`),
      parentSpanId,
      name,
      kind: 1,
      startTimeUnixNano: time,
      endTimeUnixNano: time,
      status: { code: event.exitCode === 0 ? 1 : event.exitCode === undefined ? 0 : 2 },
      attributes,
    };
  }
}
