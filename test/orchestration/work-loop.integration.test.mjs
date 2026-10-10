import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { load, dump } from 'js-yaml';
import { installWorkflow, uploadNamespaceFile } from '../../src/install.mjs';

const url = process.env.KESTRA_TEST_URL;
const email = process.env.KESTRA_ADMIN_EMAIL;
const password = process.env.KESTRA_ADMIN_PASSWORD;
const bridgeHost = process.env.KESTRA_TEST_BRIDGE_HOST || 'host.docker.internal';
const template = readFileSync(new URL('../../orchestration/work_loop.yaml', import.meta.url), 'utf8');
const workTemplate = readFileSync(new URL('../../orchestration/work.yaml', import.meta.url), 'utf8');

// Opt in against the repository's Kestra instance. No inference or production flow is used.
test('Kestra repeats every outcome, deploys intervals, and stops on kill', { skip: !url, timeout: 120000 }, async t => {
  assert.ok(email && password, 'Kestra test credentials are required');
  const namespace = `agent_workflows_test_${randomUUID().replaceAll('-', '')}`;
  const headers = { Authorization: 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64') };
  const api = async (path, options = {}) => {
    const response = await fetch(`${url}/api/v1/main${path}`, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(10000) });
    assert.ok(response.ok, `Kestra ${path}: HTTP ${response.status}: ${response.ok ? '' : await response.text()}`);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
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
  const work = load(workTemplate);
  work.namespace = namespace;
  const replaceUris = tasks => {
    for (const task of tasks) {
      if (task.uri) task.uri = `http://${bridgeHost}:${server.address().port}/generate`;
      for (const children of Object.values(task.cases ?? {})) replaceUris(children);
    }
  };
  replaceUris(work.tasks);
  await installWorkflow({ url, email, password, namespace, id: 'work', workflow: dump(work) });
  const controller = load(template);
  controller.namespace = namespace;
  controller.tasks[0].tasks[0].namespace = namespace;
  const deploy = async seconds => {
    const workflow = dump(controller);
    const validation = await api('/flows/validate', { method: 'POST', headers: { 'Content-Type': 'application/x-yaml' }, body: workflow });
    assert.ok(validation.every(result => !result.constraints && !result.exception), JSON.stringify(validation));
    await uploadNamespaceFile({ url, email, password, namespace, path: 'agent-workflows.yaml',
      contents: `orchestration: {workLoop: {intervalSeconds: ${seconds}}}` });
    const status = await installWorkflow({ url, email, password, namespace, id: 'work_loop', workflow, managed: true });
    const deployed = await api(`/flows/${namespace}/work_loop`);
    assert.equal(deployed.tasks[0].checkFrequency.interval, 'PT0.001S');
    assert.equal(deployed.tasks[0].tasks.at(-1).duration, 'PT{{ inputs.intervalSeconds }}S');
    return status;
  };
  let active;
  t.after(async () => {
    if (active) await api(`/executions/${active}/actions/kill`, { method: 'DELETE' });
    await api(`/flows/${namespace}/work_loop`, { method: 'DELETE' });
    await api(`/flows/${namespace}/work`, { method: 'DELETE' });
  });
  assert.equal(await deploy(2), 'created');
  const start = async () => {
    const execution = await api(`/executions/${namespace}/work_loop`, { method: 'POST', body: new FormData() });
    active = execution.id;
    return execution.id;
  };
  const stop = async id => {
    await api(`/executions/${id}/actions/kill`, { method: 'DELETE' });
    await waitFor(() => api(`/executions/${id}`), execution => execution.state.current === 'KILLED', 'controller kill');
    active = undefined;
  };
  for (const scenario of ['success', 'failure', 'no-item']) {
    await t.test(scenario, async () => {
      outcome = scenario;
      const before = nextCalls.length;
      const id = await start();
      try {
        const execution = await waitFor(() => api(`/executions/${id}`), value =>
          nextCalls.length >= before + 2 && value.taskRunList?.some(task => task.taskId === 'cycle-result' && task.state.current === 'SUCCESS'),
          `${scenario} cycles`);
        assert.ok(['RUNNING', 'PAUSED'].includes(execution.state.current));
        const children = await Promise.all(nextCalls.slice(before, before + 2).map(call =>
          waitFor(() => api(`/executions/${call.requestId.replace(/-next$/, '')}`), child => ['SUCCESS', 'FAILED'].includes(child.state.current), 'child completion')));
        for (const child of children) {
          assert.equal(child.state.current, scenario === 'failure' ? 'FAILED' : 'SUCCESS');
          if (scenario === 'failure') {
            assert.ok(child.taskRunList.some(task => task.taskId === 'next' && task.state.current === 'FAILED'));
            const logs = await api(`/logs/${child.id}?minLevel=ERROR`);
            assert.match(JSON.stringify(logs), /Fixture inference failure/);
            assert.match(JSON.stringify(logs), /trace\.example\.test/);
          } else {
            const childLogs = await api(`/logs/${child.id}`);
            if (scenario === 'no-item') assert.ok(child.taskRunList.some(task => task.taskId === 'no-item' && task.state.current === 'SUCCESS'));
            else assert.ok(child.taskRunList.some(task => task.taskId === 'work' && task.state.current === 'SUCCESS'));
            assert.ok(childLogs.length > 0);
          }
        }
        const controllerLogs = JSON.stringify(await api(`/logs/${id}`));
        for (const child of children) assert.ok(controllerLogs.includes(child.id), 'Controller keeps each child execution link');
        assert.ok(nextCalls[before + 1].time - Date.parse(children[0].state.endDate) >= 1900, 'Wait starts after child completion');
        assert.ok(Date.parse(children[1].state.startDate) > Date.parse(children[0].state.endDate), 'Children must not overlap');
        await stop(id);
        const stoppedCount = nextCalls.length;
        await delay(2600);
        assert.equal(nextCalls.length, stoppedCount, 'Kill prevents another next call');
        t.diagnostic(`${scenario}: controller ${id}; children ${children.map(child => child.id).join(', ')}`);
      } finally {
        if (active === id) await stop(id);
      }
    });
  }
  await t.test('kill while a child is running prevents another cycle', async () => {
    outcome = 'blocked';
    const before = nextCalls.length;
    const id = await start();
    try {
      await waitFor(async () => nextCalls.length, count => count > before, 'active child request');
      const duplicate = await api(`/executions/${namespace}/work_loop`, { method: 'POST', body: new FormData() });
      await waitFor(() => api(`/executions/${duplicate.id}`), execution => execution.state.current === 'FAILED', 'duplicate controller rejected');
      await api(`/executions/${id}/actions/kill`, { method: 'DELETE' });
      await waitFor(() => api(`/executions/${id}`), execution => ['KILLING', 'KILLED'].includes(execution.state.current), 'active controller kill request');
      releaseNext();
      await waitFor(() => api(`/executions/${id}`), execution => execution.state.current === 'KILLED', 'active controller kill completion');
      active = undefined;
      await delay(2600);
      assert.equal(nextCalls.length, before + 1, 'Kill prevents relaunch after the active request');
    } finally {
      releaseNext?.();
      if (active === id) await stop(id);
    }
  });
  await t.test('redeploy changes the interval and retains work', async () => {
    assert.equal(await deploy(3), 'updated');
    assert.equal(await installWorkflow({ url, email, password, namespace, id: 'work', workflow: 'invalid' }), 'retained');
    outcome = 'no-item';
    const before = nextCalls.length;
    const id = await start();
    const execution = await waitFor(() => api(`/executions/${id}`), value => nextCalls.length >= before + 2 && value.taskRunList?.some(task => task.taskId === 'cycle-result' && task.state.current === 'SUCCESS'), 'updated interval cycles');
    const child = await api(`/executions/${nextCalls[before].requestId.replace(/-next$/, '')}`);
    assert.ok(nextCalls[before + 1].time - Date.parse(child.state.endDate) >= 2900);
    await stop(id);
  });
});
