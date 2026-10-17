import { MAX_TIMEOUT_MS } from '../config/keys.ts';
import type { TaskInput } from '../types/task.types.ts';
import { ProviderError } from '../errors/provider.error.ts';
import type { Validator } from '../types/validator.types.ts';

export class TaskInputValidator implements Validator<TaskInput> {
  validate(value: unknown): asserts value is TaskInput {
    const body = value as Record<string, unknown> | null;
    if (!body || typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 16000) {
      throw new ProviderError('invalid_input', 'Prompt must contain 1–16000 characters.');
    }
    if (typeof body.requestId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(body.requestId)) {
      throw new ProviderError('invalid_input', 'Provide a requestId (8–100 letters, digits, underscores or hyphens).');
    }
    if (body.directory !== undefined && (typeof body.directory !== 'string' || !body.directory.trim())) {
      throw new ProviderError('invalid_input', 'directory must be a nonempty string.');
    }
    if (body.timeoutMs !== undefined && (!Number.isInteger(body.timeoutMs) || (body.timeoutMs as number) < 1 || (body.timeoutMs as number) > MAX_TIMEOUT_MS)) {
      throw new ProviderError('invalid_input', `timeoutMs must be 1–${MAX_TIMEOUT_MS}.`);
    }
    if (body.trace !== undefined) {
      const trace = body.trace as Record<string, unknown> | null;
      const validLabel = (label: unknown) => typeof label === 'string' && label.trim().length > 0 && label.length <= 100;
      if (!trace || typeof trace !== 'object' || Array.isArray(trace) ||
          !validLabel(trace.name) || !validLabel(trace.observationName) ||
          !Array.isArray(trace.tags) || trace.tags.length > 10 || !trace.tags.every(validLabel) ||
          (trace.level !== undefined && !['DEBUG', 'DEFAULT', 'WARNING', 'ERROR'].includes(trace.level as string))) {
        throw new ProviderError('invalid_input', 'trace requires a name, observationName, up to 10 tags, and a valid level when provided.');
      }
    }
  }
}
