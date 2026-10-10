import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { installWorkflow, uploadNamespaceFile } from '../../src/install.mjs';

const url = process.env.KESTRA_TEST_URL;
const email = process.env.KESTRA_ADMIN_EMAIL;
const password = process.env.KESTRA_ADMIN_PASSWORD;
const bridgeHost = process.env.KESTRA_TEST_BRIDGE_HOST || 'host.docker.internal';
const template = readFileSync(new URL('../../orchestration/work.yaml', import.meta.url), 'utf8');

test('Kestra repeats work in one flow after every outcome and stops on kill', { skip: !url, timeout: 120000 }, async t => {
  assert.ok(email && password, 'Kestra test credentials are required');
  const namespace = `agent_workflows_test_${randomUUID().replaceAll('-', '')}`;
  const headers = { Authorization: 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64') };
  const api = async (path, options = {}) => {
    const response = await fetch(`${url}/api/v1/main${path}`, {
      ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(10000),
    });
    assert.ok(response.ok, `Kestra ${path}: HTTP ${response.status}: ${response.ok ? '' : await response.text()}`);
    const body = await response.text();
    return body ? JSON.parse(body) : null;
  };
  const waitFor = async (read, predicate, description) => {
    const deadline = Date.now() + 30000;
    let value;
    do {
      value = await read();
      if (predicate(value)) return value;
      await delay(200);
    } while (Date.now() < deadline);
    assert.fail(`Timed out waiting for ${description}: ${JSON.stringify(value)}`);
  };
  const nextCalls = [];
  let outcome = 'no-item';
  let releaseNext;
  const server = createServer(async (request, response) => {
    try {
      let body = '';
      for await (const chunk of request) body += chunk;
      const task = JSON.parse(body);
      const traceUrl = `https://trace.example.test/${task.requestId}`;
      let text;
      if (task.prompt === 'Execute /next') {
        nextCalls.push({ time: Date.now(), requestId: task.requestId });
        if (outcome === 'blocked') await new Promise(resolve => { releaseNext = resolve; });
        if (outcome === 'failure') {
          response.writeHead(502, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: 'Fixture inference failure', traceUrl }));
          return;
        }
        text = JSON.stringify(['no-item', 'blocked'].includes(outcome) ? { status: 'no eligible item' } : {
          name: 'Loop fixture', id: 'ICY-121', url: 'https://linear.app/test/issue/ICY-121', list: 'Test',
        });
      } else if (task.prompt.startsWith('Execute /project')) {
        text = JSON.stringify({ path: '/fixture' });
      } else {
        text = '## Inspect result\n\n**Request #1:** inspection completed without findings\n**Item ICY-121:** agent-inspected applied';
      }
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ text, traceUrl }));
    } catch (error) {
      response.writeHead(500);
      response.end(error.message);
    }
  });
  await new Promise(resolve => server.listen(0, '0.0.0.0', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const workflow = template
    .replace(/^namespace: agent_workflows$/m, `namespace: ${namespace}`)
    .replace(/^(\s*)uri: '\{\{ envs.bridge_url \}\}\/generate'$/gm,
      (_, indent) => `${indent}uri: http://${bridgeHost}:${server.address().port}/generate`);
  const deploy = async seconds => {
    const validation = await api('/flows/validate', { method: 'POST', headers: { 'Content-Type': 'application/x-yaml' }, body: workflow });
    assert.ok(validation.every(result => !result.constraints && !result.exception), JSON.stringify(validation));
    const status = await installWorkflow({ url, email, password, namespace, id: 'work', workflow, managed: true });
    await uploadNamespaceFile({ url, email, password, namespace, path: 'agent-workflows.yaml',
      contents: `orchestration: {workLoop: {intervalSeconds: ${seconds}}}` });
    return status;
  };
  let active;
  t.after(async () => {
    if (active) await api(`/executions/${active}/actions/kill`, { method: 'DELETE' });
    await api(`/flows/${namespace}/work`, { method: 'DELETE' });
  });
  assert.equal(await deploy(2), 'created');
  for (const invalid of ['0', '1.5']) {
    const body = new FormData();
    body.set('intervalSeconds', invalid);
    const response = await fetch(`${url}/api/v1/main/executions/${namespace}/work`, {
      method: 'POST', headers, body,
    });
    assert.ok(!response.ok, `Kestra accepted invalid interval ${invalid}`);
  }
  const start = async () => {
    const execution = await api(`/executions/${namespace}/work`, { method: 'POST', body: new FormData() });
    active = execution.id;
    return execution.id;
  };
  const stop = async id => {
    await api(`/executions/${id}/actions/kill`, { method: 'DELETE' });
    await waitFor(() => api(`/executions/${id}`), execution => execution.state.current === 'KILLED', 'controller kill');
    active = undefined;
  };
  const callsFor = id => nextCalls.filter(call => call.requestId.startsWith(`${id}-next-`));
  for (const scenario of ['success', 'failure', 'no-item']) {
    await t.test(scenario, async () => {
      outcome = scenario;
      const id = await start();
      try {
        const expected = scenario === 'success' ? 'work' : scenario === 'failure' ? 'next' : 'no-item';
        const execution = await waitFor(() => api(`/executions/${id}`), value =>
          callsFor(id).length >= 2 && value.taskRunList.some(task =>
            task.taskId === expected && task.state.current === (scenario === 'failure' ? 'FAILED' : 'SUCCESS')),
          `${scenario} cycles`);
        const calls = callsFor(id);
        assert.ok(['RUNNING', 'PAUSED'].includes(execution.state.current));
        assert.notEqual(calls[0].requestId, calls[1].requestId);
        assert.ok(calls[1].time - calls[0].time >= 1900);
        const cycleTasks = execution.taskRunList;
        assert.ok(cycleTasks.some(task => task.taskId === expected && task.state.current === (scenario === 'failure' ? 'FAILED' : 'SUCCESS')));
        if (scenario === 'failure') {
          const logs = JSON.stringify(await api(`/logs/${id}`));
          assert.match(logs, /Fixture inference failure/);
          assert.match(logs, /trace\.example\.test/);
        }
        await stop(id);
        const count = callsFor(id).length;
        await delay(2600);
        assert.equal(callsFor(id).length, count);
      } finally {
        if (active === id) await stop(id);
      }
    });
  }
  await t.test('kill during work and reject a second controller', async () => {
    outcome = 'blocked';
    const id = await start();
    try {
      await waitFor(async () => callsFor(id).length, count => count > 0, 'active next request');
      const duplicate = await api(`/executions/${namespace}/work`, { method: 'POST', body: new FormData() });
      await waitFor(() => api(`/executions/${duplicate.id}`), execution => execution.state.current === 'FAILED', 'duplicate rejected');
      await api(`/executions/${id}/actions/kill`, { method: 'DELETE' });
      releaseNext();
      await waitFor(() => api(`/executions/${id}`), execution => execution.state.current === 'KILLED', 'active controller kill');
      active = undefined;
      await delay(2600);
      assert.equal(callsFor(id).length, 1);
    } finally {
      releaseNext?.();
      if (active === id) await stop(id);
    }
  });
  await t.test('redeploy changes the delay', async () => {
    assert.equal(await deploy(3), 'updated');
    outcome = 'no-item';
    const id = await start();
    try {
      await waitFor(() => api(`/executions/${id}`), () => callsFor(id).length >= 2, 'updated delay cycles');
      const calls = callsFor(id);
      assert.ok(calls[1].time - calls[0].time >= 2900);
    } finally {
      if (active === id) await stop(id);
    }
  });
});
