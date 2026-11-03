import type { ServerResponse } from 'node:http';
import type { ScriptExecutionService } from '../services/script-execution.service.ts';
import type { JsonHttpResponseService } from '../core/services/json-http-response.service.ts';
import type { ControllerServices } from '../services/controller-services.service.ts';

export class ScriptController {
  private readonly scripts: ScriptExecutionService;
  private readonly responses: JsonHttpResponseService;

  constructor(services: ControllerServices) {
    this.scripts = services.scripts;
    this.responses = services.json;
  }

  async handle(input: unknown, response: ServerResponse): Promise<void> {
    this.responses.send(response, 200, await this.scripts.execute(input));
  }
}
