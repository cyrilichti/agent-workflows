import { DEFAULT_TIMEOUT_MS } from '../config/keys.ts';
import type { TaskEntity } from '../entities/task.entity.ts';
import type { TaskInputEntity } from '../entities/task-input.entity.ts';
import type { TaskResultEntity } from '../entities/task-result.entity.ts';
import type { AiProvider, TaskResult } from '../types/task.types.ts';
import type { Validator } from '../types/validator.types.ts';
import { TaskOutputValidator } from '../validators/task-output.validator.ts';

export class TaskInferenceService {
  private readonly provider: AiProvider;
  private readonly timeoutMs: number;
  private readonly validator: Validator<TaskResult> = new TaskOutputValidator();

  constructor(provider: AiProvider, timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.provider = provider;
    this.timeoutMs = timeoutMs;
  }

  async generate(input: TaskInputEntity, outcome: TaskEntity, signal: AbortSignal): Promise<TaskResultEntity> {
    const result = await this.provider.generate(input.prompt, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(input.timeoutMs ?? this.timeoutMs)]),
      traceId: outcome.traceId,
      phase: input.trace?.observationName,
      requestId: input.requestId,
      ...(input.directory !== undefined ? { directory: input.directory } : {}),
    });
    this.validator.validate(result);
    return result;
  }
}
