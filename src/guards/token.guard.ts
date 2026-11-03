import type { IncomingMessage } from 'node:http';
import { SecurityService } from '../core/services/security.service.ts';
import type { AppConfig } from '../types/app-config.types.ts';

export function tokenGuard(request: IncomingMessage, config: AppConfig): boolean {
  return new SecurityService(config.http.token).isAuthorized(request);
}
