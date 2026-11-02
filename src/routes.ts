import type { IncomingMessage, ServerResponse } from 'node:http';
import type { TaskController } from './controllers/task.controller.ts';
import type { HealthEntity } from './entities/health.entity.ts';
import type { NextSelectionService } from './services/next-selection.service.ts';
import type { ProjectResolutionService } from './services/project-resolution.service.ts';
import { TaskRequestService } from './services/task-request.service.ts';
import { TaskHttpResponseService } from './services/task-http-response.service.ts';
import { JsonHttpResponseService } from './core/services/json-http-response.service.ts';

export type RouteContext = {
  health: () => HealthEntity;
  task: () => TaskController;
  next: () => Pick<NextSelectionService, 'select'>;
  project: () => Pick<ProjectResolutionService, 'resolve'>;
};

type Route = {
  path: string;
  method: 'GET' | 'POST';
  public?: boolean;
  controller: (context: RouteContext) => (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;
};

export const routes: readonly Route[] = [
  {
    path: '/health', method: 'GET', public: true,
    controller: (context) => (_request, response) => {
      new JsonHttpResponseService().send(response, 200, context.health());
    },
  },
  {
    path: '/', method: 'POST',
    controller: (context) => async (request, response) => {
      const input = await new TaskRequestService().parseTaskInput(request);
      const result = await context.task().postTask(input);
      new TaskHttpResponseService().sendTask(response, result);
    },
  },
  {
    path: '/next', method: 'POST',
    controller: (context) => async (_request, response) => {
      new JsonHttpResponseService().send(response, 200, await context.next().select());
    },
  },
  {
    path: '/project', method: 'POST',
    controller: (context) => async (request, response) => {
      const input = await new TaskRequestService().parseTaskInput(request);
      new JsonHttpResponseService().send(response, 200, await context.project().resolve(input));
    },
  },
];
