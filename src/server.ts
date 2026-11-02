import { createServer } from 'node:http';
import { ConfigValidator } from './validators/config.validator.ts';
import { SecurityService } from './core/services/security.service.ts';
import { JsonHttpResponseService } from './core/services/json-http-response.service.ts';
import { TaskHttpResponseService } from './services/task-http-response.service.ts';
import { createRoutes } from './routes.ts';
import type { AppConfig } from './types/app-config.types.ts';
import type { Validator } from './types/validator.types.ts';
import { HTTP_REQUEST_TIMEOUT_MS } from './config/keys.ts';

export function createBridgeServer(config: AppConfig, shutdown?: AbortSignal) {
  const routes = createRoutes(config, shutdown);
  const security = new SecurityService(config.http.token);
  const json = new JsonHttpResponseService();
  const responses = new TaskHttpResponseService();
  const server = createServer(async (request, response) => {
    try {
      const route = routes.find((route) => route.method === request.method && route.path === request.url);
      if (!route?.public && !security.isAuthorized(request)) {
        json.send(response, 401, { error: 'unauthorized' });
      } else if (route) {
        await route.controller(request, response);
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
  const configValidator: Validator<AppConfig> = new ConfigValidator();
  configValidator.validate(appConfig);
  const shutdown = new AbortController();
  const httpServer = createBridgeServer(appConfig, shutdown.signal);
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
