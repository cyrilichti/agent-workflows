import type { ServerResponse } from 'node:http';
import type { TaskService } from '../services/task.service.ts';
import type { TaskHttpResponseService } from '../services/task-http-response.service.ts';
import type { TaskResponseEntity } from '../entities/task-response.entity.ts';
import type { ControllerServices } from '../services/controller-services.service.ts';

export class TaskController {
  private readonly taskExecution: Pick<TaskService, 'executeTask'>;
  private readonly responses: TaskHttpResponseService;

  constructor(services: ControllerServices) {
    this.taskExecution = services.tasks;
    this.responses = services.responses;
  }

  postTask(input: unknown): Promise<TaskResponseEntity> {
    return this.taskExecution.executeTask(input);
  }

  async handle(input: unknown, response: ServerResponse): Promise<void> {
    this.responses.sendTask(response, await this.postTask(input));
  }
}
