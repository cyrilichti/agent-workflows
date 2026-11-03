import { JsonHttpResponseService } from '../core/services/json-http-response.service.ts';
import type { AppConfig } from '../types/app-config.types.ts';
import { AiProviderService } from './ai-provider.service.ts';
import { ScriptExecutionService } from './script-execution.service.ts';
import { TaskHttpResponseService } from './task-http-response.service.ts';
import { TaskService } from './task.service.ts';
import { TraceService } from './trace.service.ts';

// One context per server; controllers resolve only the services they need.
export class ControllerServices {
  readonly config: AppConfig;
  readonly json = new JsonHttpResponseService();
  readonly responses = new TaskHttpResponseService();
  private taskExecution?: TaskService;
  private scriptExecution?: ScriptExecutionService;

  constructor(config: AppConfig) {
    this.config = config;
  }

  get tasks(): TaskService {
    if (!this.taskExecution) {
      const config = this.config;
      const trace = new TraceService(config.langfuse);
      this.taskExecution = new TaskService({
        provider: new AiProviderService().create(config.providerName, config.providerOptions),
        providerName: config.providerName,
        model: config.model || 'configured-default',
        trace: (record) => trace.send(record),
        publicUrl: config.langfuse.publicUrl,
        projectId: config.langfuse.projectId,
        ...config.execution,
      });
    }
    return this.taskExecution;
  }

  get scripts(): ScriptExecutionService {
    return this.scriptExecution ??= new ScriptExecutionService(this.config.providerOptions.directory);
  }

  cancelActiveTask(): void {
    this.taskExecution?.cancelActiveTask();
  }
}
