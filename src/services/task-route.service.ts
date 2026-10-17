import type { IncomingMessage, ServerResponse } from 'node:http';
import { TaskController } from '../controllers/task.controller.ts';
import { SecurityService } from '../core/services/security.service.ts';
import { TaskRequestService } from './task-request.service.ts';
import { TaskHttpResponseService } from './task-http-response.service.ts';
import { JsonHttpResponseService } from '../core/services/json-http-response.service.ts';

export class TaskRouteService {
  private readonly controller: TaskController;
  private readonly security: SecurityService;
  private readonly requests = new TaskRequestService();
  private readonly responses = new TaskHttpResponseService();
  private readonly json = new JsonHttpResponseService();

  constructor(controller: TaskController, security: SecurityService) {
    this.controller = controller;
    this.security = security;
  }

  async dispatch(request: IncomingMessage, response: ServerResponse): Promise<void> {
    try {
      if (request.method === 'GET' && request.url === '/health') {
        this.json.send(response, 200, this.controller.getHealth());
      } else if (!this.security.isAuthorized(request)) {
        this.json.send(response, 401, { error: 'unauthorized' });
      } else if (request.method === 'POST' && request.url === '/') {
        const input = await this.requests.parseTaskInput(request);
        const result = await this.controller.postTask(input);
        this.responses.sendTask(response, result);
      } else {
        this.json.send(response, 404, { error: 'not_found' });
      }
    } catch (error) {
      this.responses.sendError(response, error);
    }
  }
}
