import type { IncomingMessage, ServerResponse } from 'node:http';
import { HealthEntity } from '../entities/health.entity.ts';
import { JsonHttpResponseService } from '../core/services/json-http-response.service.ts';
import type { AppConfig } from '../types/app-config.types.ts';

export class HealthController {
  private readonly config: AppConfig;
  private readonly response: ServerResponse;
  private readonly responses = new JsonHttpResponseService();

  constructor(_request: IncomingMessage, response: ServerResponse, config: AppConfig, _shutdown: AbortSignal) {
    this.config = config;
    this.response = response;
  }

  reportHealth(): void {
    this.responses.send(this.response, 200, new HealthEntity(this.config.providerName, this.config.execution.enabled));
  }
}
