import type { TaskResponse } from '../types/task.types.ts';
import { registerHooks } from 'node:module';

// Observe construction while running the actual entry point in a child process.
registerHooks({
  load(url, context, nextLoad) {
    const name = new Map([
      ['health', 'HealthController'], ['task', 'TaskController'], ['script', 'ScriptController'],
    ]).get(url.match(/\/controllers\/(\w+)\.controller\.ts$/)?.[1] ?? '');
    if (!name) return nextLoad(url, context);
    return {
      format: 'module', shortCircuit: true,
      source: `import { ${name} as Base } from ${JSON.stringify(`${url}?original`)};
        export class ${name} extends Base {
          constructor(...args) { super(...args); process.send({ event: 'controller', name: '${name}' }); }
        }`,
    };
  },
});

const { AiProviderService } = await import('../services/ai-provider.service.ts');
const { TaskService } = await import('../services/task.service.ts');
const { ScriptExecutionService } = await import('../services/script-execution.service.ts');
const { TaskController } = await import('../controllers/task.controller.ts');
const { TaskResponseEntity } = await import('../entities/task-response.entity.ts');
const { TaskResultEntity } = await import('../entities/task-result.entity.ts');
const { TraceService } = await import('../services/trace.service.ts');
const { HttpError } = await import('../core/errors/http.error.ts');

AiProviderService.prototype.create = () => {
  process.send!({ event: 'provider' });
  return {
    generate: async () => {
      process.send!({ event: 'generating' });
      return new Promise<InstanceType<typeof TaskResultEntity>>((resolve) => {
        process.once('message', () => resolve(new TaskResultEntity({ text: 'OK', model: 'test' })));
      });
    },
  };
};
TraceService.prototype.send = async () => {};
const cancel = TaskService.prototype.cancelActiveTask;
TaskService.prototype.cancelActiveTask = function () {
  process.send!({ event: 'cancel' });
  cancel.call(this);
};
const instances = new WeakSet();
ScriptExecutionService.prototype.execute = async function (input) {
  process.send!({ event: 'scripts', input, reused: instances.has(this) });
  instances.add(this);
  throw new HttpError(400, 'invalid_script_input');
};
if (process.env.BRIDGE_TEST_MODE !== 'busy') {
  TaskController.prototype.postTask = async (input) => {
    process.send!({ event: 'task', input });
    if (process.env.BRIDGE_TEST_MODE === 'throw') throw new Error('private failure');
    const status = (process.env.BRIDGE_TEST_MODE || 'completed') as TaskResponse['status'];
    return new TaskResponseEntity({
      requestId: 'request-001', provider: 'codex', model: 'test', status,
      text: null, error: status === 'unknown' ? { code: 'timeout', message: 'Timed out' } : null,
      usage: null, durationMs: null, providerRequestId: null,
      traceId: '0123456789abcdef0123456789abcdef', traceStatus: 'accepted',
      traceUrl: 'http://localhost:3001/project/agent-workflows/traces/123',
    });
  };
}
