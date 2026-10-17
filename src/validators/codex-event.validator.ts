import { ProviderError } from '../errors/provider.error.ts';
import { isRecord } from '../helper.ts';
import type { CodexRawEvent } from '../types/trace.types.ts';
import type { Validator } from '../types/validator.types.ts';

export class CodexEventValidator implements Validator<CodexRawEvent> {
  validate(value: unknown): asserts value is CodexRawEvent {
    if (!isRecord(value) || typeof value.type !== 'string' ||
        (value.thread_id !== undefined && typeof value.thread_id !== 'string')) {
      throw new ProviderError('invalid_output', 'Invalid Codex event stream.');
    }
    if (value.usage !== undefined) {
      const usage = value.usage;
      if (!isRecord(usage) || typeof usage.input_tokens !== 'number' ||
          typeof usage.output_tokens !== 'number' ||
          (usage.cached_input_tokens !== undefined && typeof usage.cached_input_tokens !== 'number')) {
        throw new ProviderError('invalid_output', 'Invalid Codex event stream.');
      }
    }
    if (value.item !== undefined) {
      const item = value.item;
      if (!isRecord(item) ||
          ['type', 'id', 'text', 'command', 'server', 'tool', 'aggregated_output', 'output']
            .some((field) => item[field] !== undefined && typeof item[field] !== 'string') ||
          (item.exit_code !== undefined && typeof item.exit_code !== 'number')) {
        throw new ProviderError('invalid_output', 'Invalid Codex event stream.');
      }
    }
  }
}
