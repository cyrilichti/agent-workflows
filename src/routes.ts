import type { IncomingMessage, ServerResponse } from 'node:http';
import { HealthController } from './controllers/health.controller.ts';
import { ScriptController } from './controllers/script.controller.ts';
import { TaskController } from './controllers/task.controller.ts';
import { tokenGuard } from './guards/token.guard.ts';
import type { AppConfig } from './types/app-config.types.ts';
import type { ControllerServices } from './services/controller-services.service.ts';

export type Route = {
  method: 'GET' | 'POST';
  path: string;
  controller: new (services: ControllerServices) => {
    handle(input: unknown, response: ServerResponse): void | Promise<void>;
  };
  action: 'handle';
  guard?: (request: IncomingMessage, config: AppConfig) => boolean | Promise<boolean>;
};

export const routes: readonly Route[] = [
  { method: 'GET', path: '/health', controller: HealthController, action: 'handle' },
  { method: 'POST', path: '/', controller: TaskController, action: 'handle', guard: tokenGuard },
  { method: 'POST', path: '/scripts', controller: ScriptController, action: 'handle', guard: tokenGuard },
];
