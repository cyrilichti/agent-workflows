import { TraceItemEntity } from '../entities/trace-item.entity.ts';
import type { TaskOutcome } from '../types/task.types.ts';
import type { CodexEventItem, TraceAttribute, TraceSpan } from '../types/trace.types.ts';
import { TraceItemSpanBuilder } from './trace-item-span.builder.ts';

export class TraceItemBuilder {
  private readonly spans = new TraceItemSpanBuilder();

  buildMany(record: TaskOutcome, events: CodexEventItem[], shared: TraceAttribute[], parentSpanId: string): TraceSpan[] {
    let commandIndex = 0;
    return events.map((event, index) => {
      if (event.type === 'command_execution') commandIndex++;
      return this.spans.build(record, new TraceItemEntity(event, index, commandIndex), shared, parentSpanId);
    });
  }
}
