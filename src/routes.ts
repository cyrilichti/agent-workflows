import type { IncomingMessage, ServerResponse } from 'node:http';
import { HealthController } from './controllers/health.controller.ts';
import { ScriptController } from './controllers/script.controller.ts';
import { TaskController } from './controllers/task.controller.ts';
import { tokenGuard } from './guards/token.guard.ts';
import type { AppConfig } from './types/app-config.types.ts';

export type Route = {
  method: 'GET' | 'POST';
  path: string;
  controller: new (request: IncomingMessage, response: ServerResponse, config: AppConfig, shutdown: AbortSignal) => object;
  action: string;
  guard?: (request: IncomingMessage, config: AppConfig) => boolean | Promise<boolean>;
};

export const routes: readonly Route[] = [
  { method: 'GET', path: '/health', controller: HealthController, action: 'reportHealth' },
  { method: 'POST', path: '/', controller: TaskController, action: 'executeTask', guard: tokenGuard },
  { method: 'POST', path: '/scripts', controller: ScriptController, action: 'executeScript', guard: tokenGuard },
];
