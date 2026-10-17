import { ProviderError } from '../errors/provider.error.ts';
import { TaskResultEntity } from '../entities/task-result.entity.ts';
import { CodexEventItemBuilder } from '../builders/codex-event-item.builder.ts';
import { JsonService } from '../core/services/json.service.ts';
import type { TokenUsage } from '../types/task.types.ts';
import type { CodexEventItem, CodexRawEvent, CodexSummary, CodexSummaryOptions } from '../types/trace.types.ts';

export class CodexEventService {
  private readonly json = new JsonService();
  private readonly items = new CodexEventItemBuilder();

  summarize(jsonl: string, options: CodexSummaryOptions): CodexSummary {
    const eventCounts: Record<string, number> = {};
    const items: CodexEventItem[] = [];
    let usage = null;
    let threadId = null;
    let malformedLines = 0;

    for (const line of jsonl.split('\n').filter(Boolean)) {
      const event = this.json.parseOrNull<CodexRawEvent>(line);
      if (!event) {
        malformedLines++;
        continue;
      }
      const type = String(event.type);
      eventCounts[type] = (eventCounts[type] ?? 0) + 1;
      if (event.type === 'thread.started') threadId = event.thread_id ?? null;
      if (event.type === 'turn.completed') usage = event.usage ?? null;
      const item = this.items.build(event, options.itemCompletedAt?.[items.length]);
      if (item) items.push(item);
    }

    return {
      schemaVersion: 2,
      traceId: options.traceId,
      phase: options.phase ?? null,
      requestId: options.requestId ?? null,
      threadId,
      model: options.model,
      promptCharacters: options.prompt.length,
      jsonlBytes: Buffer.byteLength(jsonl),
      usage,
      eventCounts,
      malformedLines,
      items,
      measurementNote: 'Only turn.completed.usage is a token count. Character counts are context-size indicators, not attributable billed tokens.',
    };
  }

  parseTurnResult(jsonl: string, model: string): TaskResultEntity {
    let output = '';
    let requestId;
    let usage: TokenUsage | undefined;
    let completed = false;
    for (const line of jsonl.split('\n').filter(Boolean)) {
      const event = this.json.parseOrNull<CodexRawEvent>(line);
      if (!event) throw new ProviderError('invalid_output', 'Invalid Codex event stream.');
      if (event.type === 'thread.started') requestId = event.thread_id;
      if (event.type === 'item.completed' && event.item?.type === 'agent_message') output = event.item.text ?? '';
      if (event.type === 'turn.failed') {
        throw new ProviderError('codex_error', 'Codex failed. Check authentication, model access and quota. No fallback was attempted.');
      }
      if (event.type === 'turn.completed') {
        completed = true;
        if (event.usage) {
          usage = {
            input: event.usage.input_tokens,
            cachedInput: event.usage.cached_input_tokens,
            output: event.usage.output_tokens,
          };
        }
      }
    }
    if (!completed || !output) {
      throw new ProviderError('invalid_output', 'Codex did not complete a text response.');
    }
    return new TaskResultEntity({ text: output, model, requestId, usage });
  }

  isItemCompletion(line: string): boolean {
    const event = this.json.parseOrNull<CodexRawEvent>(line);
    return event?.type === 'item.completed' && !!event.item;
  }
}
