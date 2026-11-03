import type { ServerResponse } from 'node:http';
import { HealthEntity } from '../entities/health.entity.ts';
import type { JsonHttpResponseService } from '../core/services/json-http-response.service.ts';
import type { AppConfig } from '../types/app-config.types.ts';

export class HealthController {
  private readonly config: AppConfig;
  private readonly responses: JsonHttpResponseService;

  constructor(config: AppConfig, responses: JsonHttpResponseService) {
    this.config = config;
    this.responses = responses;
  }

  handle(_input: unknown, response: ServerResponse): void {
    this.responses.send(response, 200, new HealthEntity(this.config.providerName, this.config.execution.enabled));
  }
}
