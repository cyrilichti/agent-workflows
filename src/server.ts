import { createServer } from 'node:http';
import { ConfigValidator } from './validators/config.validator.ts';
import { ControllerServices } from './services/controller-services.service.ts';
import { TaskRequestService } from './services/task-request.service.ts';
import { tokenGuard } from './guards/token.guard.ts';
import { routes } from './routes.ts';
import type { AppConfig } from './types/app-config.types.ts';
import type { Validator } from './types/validator.types.ts';
import { HTTP_REQUEST_TIMEOUT_MS } from './config/keys.ts';

if (import.meta.main) {
  const { appConfig } = await import('./config/app.config.ts');
  const configValidator: Validator<AppConfig> = new ConfigValidator();
  configValidator.validate(appConfig);
  const services = new ControllerServices(appConfig);
  const requests = new TaskRequestService();
  const shutdown = new AbortController();
  shutdown.signal.addEventListener('abort', () => services.cancelActiveTask(), { once: true });
  const httpServer = createServer(async (request, response) => {
    try {
      const route = routes.find((route) => route.method === request.method && route.path === request.url);
      const guard = route ? route.guard : tokenGuard;
      if (guard && !await guard(request, appConfig)) {
        services.json.send(response, 401, { error: 'unauthorized' });
        return;
      }
      if (!route) {
        services.json.send(response, 404, { error: 'not_found' });
        return;
      }
      const input = request.method === 'POST' ? await requests.parseTaskInput(request) : undefined;
      const controller = new route.controller(services);
      await controller[route.action](input, response);
    } catch (error) {
      services.responses.sendError(response, error);
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
