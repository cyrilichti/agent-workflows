import test from 'node:test';
import assert from 'node:assert/strict';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { TaskController } from './task.controller.ts';
import { HealthController } from './health.controller.ts';
import { ScriptController } from './script.controller.ts';
import { TaskService } from '../services/task.service.ts';
import { ScriptExecutionService } from '../services/script-execution.service.ts';
import { AiProviderService } from '../services/ai-provider.service.ts';
import { bridgeConfig } from '../fixtures/bridge-config.ts';

function request() {
  const message = new IncomingMessage(new Socket());
  message.headers['content-type'] = 'application/json';
  message.push('{}');
  message.push(null);
  return message;
}

test('controllers own dependencies, reuse them per server, and cancel only initialized tasks', async (t) => {
  const shutdown = new AbortController();
  const other = new AbortController();
  const provider = t.mock.method(AiProviderService.prototype, 'create');
  const cancel = t.mock.method(TaskService.prototype, 'cancelActiveTask', () => {});
  const failure = new Error('execution observed');
  const tasks = t.mock.method(TaskService.prototype, 'executeTask', async () => { throw failure; });
  const scripts = t.mock.method(ScriptExecutionService.prototype, 'execute', async () => { throw failure; });
  const healthRequest = request();
  new HealthController(healthRequest, new ServerResponse(healthRequest), bridgeConfig, shutdown.signal);
  assert.equal(provider.mock.callCount(), 0);
  const unused = new AbortController();
  unused.abort();
  assert.equal(cancel.mock.callCount(), 0);
  for (const signal of [shutdown.signal, shutdown.signal, other.signal]) {
    const taskRequest = request();
    await assert.rejects(new TaskController(taskRequest, new ServerResponse(taskRequest), bridgeConfig, signal).executeTask(), failure);
    const scriptRequest = request();
    await assert.rejects(new ScriptController(scriptRequest, new ServerResponse(scriptRequest), bridgeConfig, signal).executeScript(), failure);
  }
  assert.equal(provider.mock.callCount(), 2);
  for (const mock of [tasks.mock, scripts.mock]) {
    const [first, second, third] = mock.calls;
    assert.ok(first && second && third);
    assert.equal(first.this, second.this);
    assert.notEqual(first.this, third.this);
  }
  shutdown.abort();
  assert.equal(cancel.mock.callCount(), 1);
  const [cancelled] = cancel.mock.calls;
  const [executed] = tasks.mock.calls;
  assert.ok(cancelled && executed);
  assert.equal(cancelled.this, executed.this);
});
