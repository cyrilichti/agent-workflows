import { createServer } from 'node:http';
import { ConfigValidator } from './validators/config.validator.ts';
import { JsonHttpResponseService } from './core/services/json-http-response.service.ts';
import { TaskHttpResponseService } from './services/task-http-response.service.ts';
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
  const shutdown = new AbortController();
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
      const controller = new route.controller(request, response, appConfig, shutdown.signal);
      const action = (controller as Record<string, unknown>)[route.action];
      if (typeof action !== 'function') {
        throw new TypeError(`Controller action ${route.action} is not callable.`);
      }
      await action.call(controller);
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
