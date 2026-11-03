import type { ServerResponse } from 'node:http';
import type { TaskService } from '../services/task.service.ts';
import type { TaskHttpResponseService } from '../services/task-http-response.service.ts';
import type { TaskResponseEntity } from '../entities/task-response.entity.ts';

export class TaskController {
  private readonly taskExecution: Pick<TaskService, 'executeTask'>;
  private readonly responses: TaskHttpResponseService;

  constructor(taskExecution: Pick<TaskService, 'executeTask'>, responses: TaskHttpResponseService) {
    this.taskExecution = taskExecution;
    this.responses = responses;
  }

  postTask(input: unknown): Promise<TaskResponseEntity> {
    return this.taskExecution.executeTask(input);
  }

  async handle(input: unknown, response: ServerResponse): Promise<void> {
    this.responses.sendTask(response, await this.postTask(input));
  }
}
