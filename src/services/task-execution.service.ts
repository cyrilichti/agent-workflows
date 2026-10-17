import { randomBytes } from 'node:crypto';
import { ExclusiveExecutionService } from '../core/services/exclusive-execution.service.ts';
import { TaskEntity } from '../entities/task.entity.ts';
import type { TaskInputEntity } from '../entities/task-input.entity.ts';
import { ProviderError } from '../errors/provider.error.ts';
import type { TaskExecutionOptions } from '../types/task-service.types.ts';
import { TaskInferenceService } from './task-inference.service.ts';
import { TaskOutcomeService } from './task-outcome.service.ts';

export class TaskExecutionService {
  private readonly options: TaskExecutionOptions;
  private readonly outcomes = new TaskOutcomeService();
  private readonly exclusive = new ExclusiveExecutionService();
  private readonly inference: TaskInferenceService;

  constructor(options: TaskExecutionOptions) {
    this.options = options;
    this.inference = new TaskInferenceService(options.provider, options.timeoutMs);
  }

  cancel(): void {
    this.exclusive.cancel();
  }

  run(input: TaskInputEntity): Promise<TaskEntity> {
    if (!this.options.enabled) {
      throw new ProviderError('disabled', 'Inference disabled. Verify credentials and usage controls before enabling it.');
    }
    return this.exclusive.run(async (signal) => {
      const outcome = new TaskEntity({
        requestId: input.requestId, prompt: input.prompt,
        provider: this.options.providerName, model: this.options.model, status: 'running',
        traceId: randomBytes(16).toString('hex'), startedAt: new Date().toISOString(),
        trace: input.trace,
      });
      try {
        this.outcomes.complete(outcome, await this.inference.generate(input, outcome, signal));
      } catch (error) {
        this.outcomes.fail(outcome, error);
      }
      this.outcomes.finish(outcome);
      return outcome;
    }, new ProviderError('busy', 'One inference is already running. Try again later.'));
  }
}
