import type { TaskControllerOptions } from '../types/http.types.ts';
import type { HealthEntity } from '../entities/health.entity.ts';
import type { TaskResponseEntity } from '../entities/task-response.entity.ts';

export class TaskController {
  private readonly options: TaskControllerOptions;

  constructor(options: TaskControllerOptions) {
    this.options = options;
  }

  getHealth(): HealthEntity {
    return this.options.taskExecution.getHealth();
  }

  postTask(input: unknown): Promise<TaskResponseEntity> {
    return this.options.taskExecution.executeTask(input);
  }
}
