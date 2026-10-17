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
    if (typeof value.requestId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(value.requestId)) {
      throw new ProviderError('invalid_input', 'Provide a requestId (8–100 letters, digits, underscores or hyphens).');
    }
    if (value.directory !== undefined && (typeof value.directory !== 'string' || !value.directory.trim())) {
      throw new ProviderError('invalid_input', 'directory must be a nonempty string.');
    }
    if (value.timeoutMs !== undefined && (typeof value.timeoutMs !== 'number' || !Number.isInteger(value.timeoutMs) || value.timeoutMs < 1 || value.timeoutMs > MAX_TIMEOUT_MS)) {
      throw new ProviderError('invalid_input', `timeoutMs must be 1–${MAX_TIMEOUT_MS}.`);
    }
    if (value.trace !== undefined) {
      const trace = value.trace;
      const validLabel = (label: unknown) => typeof label === 'string' && label.trim().length > 0 && label.length <= 100;
      const validSessionId = (id: unknown) => typeof id === 'string' && /^[\x20-\x7E]{1,100}$/.test(id) && id.trim().length > 0;
      if (!isRecord(trace) ||
          !validLabel(trace.name) || !validLabel(trace.observationName) ||
          (trace.sessionId !== undefined && !validSessionId(trace.sessionId)) ||
          !Array.isArray(trace.tags) || trace.tags.length > 10 || !trace.tags.every(validLabel) ||
          (trace.level !== undefined && (typeof trace.level !== 'string' || !['DEBUG', 'DEFAULT', 'WARNING', 'ERROR'].includes(trace.level)))) {
        throw new ProviderError('invalid_input', 'trace requires a name, observationName, up to 10 tags, and valid optional sessionId and level.');
      }
    }
  }
}
