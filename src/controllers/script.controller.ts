import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppConfig } from '../types/app-config.types.ts';
import { ScriptExecutionService } from '../services/script-execution.service.ts';
import { TaskRequestService } from '../services/task-request.service.ts';
import { JsonHttpResponseService } from '../core/services/json-http-response.service.ts';

export class ScriptController {
  private static readonly executions = new WeakMap<AbortSignal, ScriptExecutionService>();
  private readonly scripts: ScriptExecutionService;
  private readonly requests = new TaskRequestService();
  private readonly responses = new JsonHttpResponseService();
  private readonly request: IncomingMessage;
  private readonly response: ServerResponse;

  constructor(request: IncomingMessage, response: ServerResponse, config: AppConfig, shutdown: AbortSignal) {
    this.request = request;
    this.response = response;
    let scripts = ScriptController.executions.get(shutdown);
    if (!scripts) {
      scripts = new ScriptExecutionService(config.providerOptions.directory);
      ScriptController.executions.set(shutdown, scripts);
    }
    this.scripts = scripts;
  }

  async handle(): Promise<void> {
    const input = await this.requests.parseTaskInput(this.request);
    this.responses.send(this.response, 200, await this.scripts.execute(input));
  }
}
