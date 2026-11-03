import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AppConfig } from '../types/app-config.types.ts';
import { TaskService } from '../services/task.service.ts';
import { TraceService } from '../services/trace.service.ts';
import { AiProviderService } from '../services/ai-provider.service.ts';
import { TaskRequestService } from '../services/task-request.service.ts';
import { TaskHttpResponseService } from '../services/task-http-response.service.ts';

export class TaskController {
  private static readonly executions = new WeakMap<AbortSignal, TaskService>();
  private readonly taskExecution: TaskService;
  private readonly requests = new TaskRequestService();
  private readonly responses = new TaskHttpResponseService();
  private readonly request: IncomingMessage;
  private readonly response: ServerResponse;

  constructor(request: IncomingMessage, response: ServerResponse, config: AppConfig, shutdown: AbortSignal) {
    this.request = request;
    this.response = response;
    let execution = TaskController.executions.get(shutdown);
    if (!execution) {
      const trace = new TraceService(config.langfuse);
      execution = new TaskService({
        provider: new AiProviderService().create(config.providerName, config.providerOptions),
        providerName: config.providerName,
        model: config.model || 'configured-default',
        trace: (record) => trace.send(record),
        publicUrl: config.langfuse.publicUrl,
        projectId: config.langfuse.projectId,
        ...config.execution,
      });
      TaskController.executions.set(shutdown, execution);
      const taskExecution = execution;
      shutdown.addEventListener('abort', () => taskExecution.cancelActiveTask(), { once: true });
    }
    this.taskExecution = execution;
  }

  async executeTask(): Promise<void> {
    const input = await this.requests.parseTaskInput(this.request);
    this.responses.sendTask(this.response, await this.taskExecution.executeTask(input));
  }
}
