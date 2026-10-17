import type { TaskResult } from '../types/task.types.ts';
import { ProviderError } from '../errors/provider.error.ts';
import type { Validator } from '../types/validator.types.ts';
import { isRecord } from '../helper.ts';
export class TaskOutputValidator implements Validator<TaskResult> {
  validate(value: unknown): asserts value is TaskResult {
    if (!isRecord(value) || typeof value.text !== 'string' || !value.text.trim() || typeof value.model !== 'string') {
      throw new ProviderError('invalid_output', 'The provider returned no usable text.');
    }
  }
}
