import { MAX_TIMEOUT_MS } from '../config/keys.ts';
import type { TaskInput } from '../types/task.types.ts';
import { ProviderError } from '../errors/provider.error.ts';
import type { Validator } from '../types/validator.types.ts';
import { isRecord } from '../helper.ts';

export class TaskInputValidator implements Validator<TaskInput> {
  validate(value: unknown): asserts value is TaskInput {
    if (!isRecord(value) || typeof value.prompt !== 'string' || !value.prompt.trim() || value.prompt.length > 16000) {
      throw new ProviderError('invalid_input', 'Prompt must contain 1–16000 characters.');
    }
    const body = value;
    if (typeof body.requestId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(body.requestId)) {
      throw new ProviderError('invalid_input', 'Provide a requestId (8–100 letters, digits, underscores or hyphens).');
    }
    if (body.directory !== undefined && (typeof body.directory !== 'string' || !body.directory.trim())) {
      throw new ProviderError('invalid_input', 'directory must be a nonempty string.');
    }
    if (body.timeoutMs !== undefined && (typeof body.timeoutMs !== 'number' || !Number.isInteger(body.timeoutMs) || body.timeoutMs < 1 || body.timeoutMs > MAX_TIMEOUT_MS)) {
      throw new ProviderError('invalid_input', `timeoutMs must be 1–${MAX_TIMEOUT_MS}.`);
    }
    if (body.trace !== undefined) {
      const trace = body.trace;
      const validLabel = (label: unknown) => typeof label === 'string' && label.trim().length > 0 && label.length <= 100;
      if (!isRecord(trace) ||
          !validLabel(trace.name) || !validLabel(trace.observationName) ||
          !Array.isArray(trace.tags) || trace.tags.length > 10 || !trace.tags.every(validLabel) ||
          (trace.level !== undefined && (typeof trace.level !== 'string' || !['DEBUG', 'DEFAULT', 'WARNING', 'ERROR'].includes(trace.level)))) {
        throw new ProviderError('invalid_input', 'trace requires a name, observationName, up to 10 tags, and a valid level when provided.');
      }
    }
  }
}
