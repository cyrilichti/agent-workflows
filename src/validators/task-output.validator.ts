import type { TaskResult } from '../types/task.types.ts';
import { ProviderError } from '../errors/provider.error.ts';
import type { Validator } from '../types/validator.types.ts';
export class TaskOutputValidator implements Validator<TaskResult> {
  validate(value: unknown): asserts value is TaskResult {
    const result = value as Record<string, unknown> | null;
    if (!result || typeof result.text !== 'string' || !result.text.trim() || typeof result.model !== 'string') {
      throw new ProviderError('invalid_output', 'The provider returned no usable text.');
    }
  }
}
