import { createServer } from 'node:http';
import { ConfigValidator } from './validators/config.validator.ts';
import { AiProviderService } from './services/ai-provider.service.ts';
import { TaskService } from './services/task.service.ts';
import { TraceService } from './services/trace.service.ts';
import { NextSelectionService } from './services/next-selection.service.ts';
import { ProjectResolutionService } from './services/project-resolution.service.ts';
import { TaskController } from './controllers/task.controller.ts';
import { SecurityService } from './core/services/security.service.ts';
import { JsonHttpResponseService } from './core/services/json-http-response.service.ts';
import { TaskHttpResponseService } from './services/task-http-response.service.ts';
import { HealthEntity } from './entities/health.entity.ts';
import { routes } from './routes.ts';
import type { RouteContext } from './routes.ts';
import { HTTP_REQUEST_TIMEOUT_MS } from './config/keys.ts';

export function createBridgeServer(token: string, context: RouteContext) {
  const security = new SecurityService(token);
  const json = new JsonHttpResponseService();
  const responses = new TaskHttpResponseService();
  const server = createServer(async (request, response) => {
    try {
      const route = routes.find((route) => route.method === request.method && route.path === request.url);
      if (!route?.public && !security.isAuthorized(request)) {
        json.send(response, 401, { error: 'unauthorized' });
      } else if (route) {
        await route.controller(context)(request, response);
      } else {
        json.send(response, 404, { error: 'not_found' });
      }
    } catch (error) {
      responses.sendError(response, error);
    }
  });
  server.requestTimeout = HTTP_REQUEST_TIMEOUT_MS;
  return server;
}

if (import.meta.main) {
  const { appConfig } = await import('./config/app.config.ts');
  new ConfigValidator().validate(appConfig);
  let taskExecution: TaskService | undefined;
  let taskController: TaskController | undefined;
  let next: NextSelectionService | undefined;
  let project: ProjectResolutionService | undefined;
  const httpServer = createBridgeServer(appConfig.http.token, {
    health: () => new HealthEntity(appConfig.providerName, appConfig.execution.enabled),
    task: () => {
      if (!taskController) {
        const traceService = new TraceService(appConfig.langfuse);
        taskExecution = new TaskService({
          provider: new AiProviderService().create(appConfig.providerName, appConfig.providerOptions),
          providerName: appConfig.providerName,
          model: appConfig.model || 'configured-default',
          trace: (record) => traceService.send(record),
          publicUrl: appConfig.langfuse.publicUrl,
          projectId: appConfig.langfuse.projectId,
          ...appConfig.execution,
        });
        taskController = new TaskController({ taskExecution });
      }
      return taskController;
    },
    next: () => next ??= new NextSelectionService(appConfig.providerOptions.directory),
    project: () => project ??= new ProjectResolutionService(appConfig.providerOptions.directory),
  });
  httpServer.listen(appConfig.http.port, appConfig.http.host, () => {
    console.log(
      `Local bridge ready on port ${appConfig.http.port} (${appConfig.providerName}); inference enabled: ${appConfig.execution.enabled}`,
    );
  });
  for (const event of ['SIGTERM', 'SIGINT']) {
    process.once(event, () => {
      taskExecution?.cancelActiveTask();
      httpServer.close();
    });
  }
}
