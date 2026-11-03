import type { IncomingMessage, ServerResponse } from 'node:http';
import { TaskController } from './controllers/task.controller.ts';
import { HealthEntity } from './entities/health.entity.ts';
import { ScriptExecutionService } from './services/script-execution.service.ts';
import { NextSelectionService } from './services/next-selection.service.ts';
import { ProjectResolutionService } from './services/project-resolution.service.ts';
import { TaskRequestService } from './services/task-request.service.ts';
import { TaskHttpResponseService } from './services/task-http-response.service.ts';
import { JsonHttpResponseService } from './core/services/json-http-response.service.ts';
import { TaskService } from './services/task.service.ts';
import { TraceService } from './services/trace.service.ts';
import { AiProviderService } from './services/ai-provider.service.ts';
import type { AppConfig } from './types/app-config.types.ts';

type Route = {
  path: string;
  method: 'GET' | 'POST';
  public?: boolean;
  controller: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>;
};

export function createRoutes(config: AppConfig, shutdown?: AbortSignal): readonly Route[] {
  let taskController: TaskController | undefined;
  let scripts: ScriptExecutionService | undefined;
  let next: NextSelectionService | undefined;
  let project: ProjectResolutionService | undefined;
  return [
    {
      path: '/health', method: 'GET', public: true,
      controller: (_request, response) => {
        const health = new HealthEntity(config.providerName, config.execution.enabled);
        new JsonHttpResponseService().send(response, 200, health);
      },
    },
    {
      path: '/', method: 'POST',
      controller: async (request, response) => {
        const input = await new TaskRequestService().parseTaskInput(request);
        if (!taskController) {
          const traceService = new TraceService(config.langfuse);
          const taskExecution = new TaskService({
            provider: new AiProviderService().create(config.providerName, config.providerOptions),
            providerName: config.providerName,
            model: config.model || 'configured-default',
            trace: (record) => traceService.send(record),
            publicUrl: config.langfuse.publicUrl,
            projectId: config.langfuse.projectId,
            ...config.execution,
          });
          shutdown?.addEventListener('abort', () => taskExecution.cancelActiveTask(), { once: true });
          taskController = new TaskController({ taskExecution });
        }
        const result = await taskController.postTask(input);
        new TaskHttpResponseService().sendTask(response, result);
      },
    },
    {
      path: '/scripts', method: 'POST',
      controller: async (request, response) => {
        const input = await new TaskRequestService().parseTaskInput(request);
        scripts ??= new ScriptExecutionService(config.providerOptions.directory);
        new JsonHttpResponseService().send(response, 200, await scripts.execute(input));
      },
    },
    {
      path: '/next', method: 'POST',
      controller: async (_request, response) => {
        next ??= new NextSelectionService(config.providerOptions.directory);
        new JsonHttpResponseService().send(response, 200, await next.select());
      },
    },
    {
      path: '/project', method: 'POST',
      controller: async (request, response) => {
        const input = await new TaskRequestService().parseTaskInput(request);
        project ??= new ProjectResolutionService(config.providerOptions.directory);
        new JsonHttpResponseService().send(response, 200, await project.resolve(input));
      },
    },
  ];
}
