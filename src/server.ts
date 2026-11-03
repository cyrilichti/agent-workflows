import { createServer } from 'node:http';
import { ConfigValidator } from './validators/config.validator.ts';
import { JsonHttpResponseService } from './core/services/json-http-response.service.ts';
import { TaskHttpResponseService } from './services/task-http-response.service.ts';
import { TaskRequestService } from './services/task-request.service.ts';
import { TaskService } from './services/task.service.ts';
import { ScriptExecutionService } from './services/script-execution.service.ts';
import { TraceService } from './services/trace.service.ts';
import { AiProviderService } from './services/ai-provider.service.ts';
import { HealthController } from './controllers/health.controller.ts';
import { TaskController } from './controllers/task.controller.ts';
import { ScriptController } from './controllers/script.controller.ts';
import { tokenGuard } from './guards/token.guard.ts';
import { routes } from './routes.ts';
import type { AppConfig } from './types/app-config.types.ts';
import type { Validator } from './types/validator.types.ts';
import { HTTP_REQUEST_TIMEOUT_MS } from './config/keys.ts';

if (import.meta.main) {
  const { appConfig } = await import('./config/app.config.ts');
  const configValidator: Validator<AppConfig> = new ConfigValidator();
  configValidator.validate(appConfig);
  const json = new JsonHttpResponseService();
  const responses = new TaskHttpResponseService();
  const requests = new TaskRequestService();
  let taskExecution: TaskService | undefined;
  let scripts: ScriptExecutionService | undefined;
  const shutdown = new AbortController();
  shutdown.signal.addEventListener('abort', () => taskExecution?.cancelActiveTask(), { once: true });
  const httpServer = createServer(async (request, response) => {
    try {
      const route = routes.find((route) => route.method === request.method && route.path === request.url);
      const guard = route ? route.guard : tokenGuard;
      if (guard && !await guard(request, appConfig)) {
        json.send(response, 401, { error: 'unauthorized' });
        return;
      }
      if (!route) {
        json.send(response, 404, { error: 'not_found' });
        return;
      }
      let controller: HealthController | TaskController | ScriptController;
      let input: unknown;
      if (route.controller === HealthController) {
        controller = new HealthController(appConfig, json);
      } else {
        input = await requests.parseTaskInput(request);
        if (route.controller === TaskController) {
          if (!taskExecution) {
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
          }
          controller = new TaskController(taskExecution, responses);
        } else {
          scripts ??= new ScriptExecutionService(appConfig.providerOptions.directory);
          controller = new ScriptController(scripts, json);
        }
      }
      await controller[route.action](input, response);
    } catch (error) {
      responses.sendError(response, error);
    }
  });
  httpServer.requestTimeout = HTTP_REQUEST_TIMEOUT_MS;
  httpServer.listen(appConfig.http.port, appConfig.http.host, () => {
    console.log(
      `Local bridge ready on port ${appConfig.http.port} (${appConfig.providerName}); inference enabled: ${appConfig.execution.enabled}`,
    );
  });
  for (const event of ['SIGTERM', 'SIGINT']) {
    process.once(event, () => {
      shutdown.abort();
      httpServer.close();
    });
  }
}
