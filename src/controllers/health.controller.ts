import type { ServerResponse } from 'node:http';
import { HealthEntity } from '../entities/health.entity.ts';
import type { JsonHttpResponseService } from '../core/services/json-http-response.service.ts';
import type { AppConfig } from '../types/app-config.types.ts';
import type { ControllerServices } from '../services/controller-services.service.ts';

export class HealthController {
  private readonly config: AppConfig;
  private readonly responses: JsonHttpResponseService;

  constructor(services: ControllerServices) {
    this.config = services.config;
    this.responses = services.json;
  }

  handle(_input: unknown, response: ServerResponse): void {
    this.responses.send(response, 200, new HealthEntity(this.config.providerName, this.config.execution.enabled));
  }
}
