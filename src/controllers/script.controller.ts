import type { ServerResponse } from 'node:http';
import type { ScriptExecutionService } from '../services/script-execution.service.ts';
import type { JsonHttpResponseService } from '../core/services/json-http-response.service.ts';

export class ScriptController {
  private readonly scripts: ScriptExecutionService;
  private readonly responses: JsonHttpResponseService;

  constructor(scripts: ScriptExecutionService, responses: JsonHttpResponseService) {
    this.scripts = scripts;
    this.responses = responses;
  }

  async handle(input: unknown, response: ServerResponse): Promise<void> {
    this.responses.send(response, 200, await this.scripts.execute(input));
  }
}
