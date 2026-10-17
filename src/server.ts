import { appConfig } from './config/app.config.ts';
import { createServer } from 'node:http';
import { ConfigValidator } from './validators/config.validator.ts';
import { AiProviderService } from './services/ai-provider.service.ts';
import { TaskService } from './services/task.service.ts';
import { TraceService } from './services/trace.service.ts';
import { TaskRouteService } from './services/task-route.service.ts';
import { TaskController } from './controllers/task.controller.ts';
import { SecurityService } from './core/services/security.service.ts';
import { HTTP_REQUEST_TIMEOUT_MS } from './config/keys.ts';
import type { AppConfig } from './types/app-config.types.ts';
import type { Validator } from './types/validator.types.ts';

const configValidator: Validator<AppConfig> = new ConfigValidator();
configValidator.validate(appConfig);
const traceService = new TraceService(appConfig.langfuse);
const taskExecution = new TaskService({
  provider: new AiProviderService().create(appConfig.providerName, appConfig.providerOptions),
  providerName: appConfig.providerName,
  model: appConfig.model || 'configured-default',
  trace: (record) => traceService.send(record),
  publicUrl: appConfig.langfuse.publicUrl,
  projectId: appConfig.langfuse.projectId,
  ...appConfig.execution,
});
const routes = new TaskRouteService(new TaskController({ taskExecution }), new SecurityService(appConfig.http.token));
const httpServer = createServer((request, response) => void routes.dispatch(request, response));
httpServer.requestTimeout = HTTP_REQUEST_TIMEOUT_MS;
httpServer.listen(appConfig.http.port, appConfig.http.host, () => {
  console.log(
    `Local bridge ready on port ${appConfig.http.port} (${appConfig.providerName}); inference enabled: ${appConfig.execution.enabled}`,
  );
});
for (const event of ['SIGTERM', 'SIGINT']) {
  process.once(event, () => {
    taskExecution.cancelActiveTask();
    httpServer.close();
  });
}
