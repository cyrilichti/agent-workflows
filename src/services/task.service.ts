import { TaskResponseBuilder } from '../builders/task-response.builder.ts';
import { HealthEntity } from '../entities/health.entity.ts';
import { TaskInputEntity } from '../entities/task-input.entity.ts';
import type { TaskResponseEntity } from '../entities/task-response.entity.ts';
import type { TaskServiceOptions } from '../types/task-service.types.ts';
import type { TaskInput } from '../types/task.types.ts';
import type { Validator } from '../types/validator.types.ts';
import { TaskInputValidator } from '../validators/task-input.validator.ts';
import { TaskExecutionService } from './task-execution.service.ts';
import { TaskTraceService } from './task-trace.service.ts';

export class TaskService {
  private readonly providerName: string;
  private readonly enabled: boolean;
  private readonly publicUrl: string;
  private readonly projectId: string;
  private readonly inputValidator: Validator<TaskInput> = new TaskInputValidator();
  private readonly execution: TaskExecutionService;
  private readonly traces: TaskTraceService;
  private readonly responses = new TaskResponseBuilder();

  constructor(options: TaskServiceOptions) {
    this.providerName = options.providerName;
    this.enabled = options.enabled;
    this.publicUrl = options.publicUrl;
    this.projectId = options.projectId;
    this.execution = new TaskExecutionService(options);
    this.traces = new TaskTraceService(options.trace);
  }

  getHealth(): HealthEntity {
    return new HealthEntity(this.providerName, this.enabled);
  }

  cancelActiveTask(): void {
    this.execution.cancel();
  }

  async executeTask(body: unknown): Promise<TaskResponseEntity> {
    this.inputValidator.validate(body);
    const input = new TaskInputEntity(body);
    const outcome = await this.execution.run(input);
    await this.traces.record(outcome);
    return this.responses.build(outcome, this.publicUrl, this.projectId);
  }
}
