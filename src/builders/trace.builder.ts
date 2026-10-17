import { traceArrayAttribute, traceAttribute } from '../helper.ts';
import { TraceEntity } from '../entities/trace.entity.ts';
import type { TaskOutcome } from '../types/task.types.ts';
import type { TraceAttribute, TraceBuildOptions } from '../types/trace.types.ts';
import { TraceGenerationBuilder } from './trace-generation.builder.ts';
import { TraceItemBuilder } from './trace-item.builder.ts';

export class TraceBuilder {
  private readonly generation = new TraceGenerationBuilder();
  private readonly items = new TraceItemBuilder();

  build(record: TaskOutcome, { environment }: TraceBuildOptions = {}): TraceEntity {
    const summary = record.provider === 'codex' && record.codexSummary?.traceId === record.traceId
      ? record.codexSummary : undefined;
    const shared: TraceAttribute[] = [
      ...(record.trace ? [traceAttribute('langfuse.trace.name', record.trace.name)] : []),
      ...(record.trace?.tags.length ? [traceArrayAttribute('langfuse.trace.tags', record.trace.tags)] : []),
      ...(environment ? [traceAttribute('langfuse.environment', environment)] : []),
    ];
    const root = this.generation.build(record, summary, shared);
    return new TraceEntity({
      resourceSpans: [{
        resource: { attributes: [traceAttribute('service.name', 'agent-workflows-local-ai')] },
        scopeSpans: [{
          scope: { name: 'local-ai', version: '1' },
          spans: [root, ...this.items.buildMany(record, summary?.items ?? [], shared, root.spanId)],
        }],
      }],
    });
  }
}
