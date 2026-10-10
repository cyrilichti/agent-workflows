import test from 'node:test';
import assert from 'node:assert/strict';
import { installDemoWorkflow, installWorkflow, uploadNamespaceFile } from '../src/install.mjs';
const config = {
  url: 'http://kestra:8080',
  email: 'local@example.test',
  password: 'test-only',
  workflow: 'id: demo\nnamespace: demo\n',
};
test('first initialization imports the YAML with local authentication', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    assert.equal(
      options.headers.Authorization,
      'Basic ' + Buffer.from('local@example.test:test-only').toString('base64'),
    );
    return new Response('{}', { status: calls.length === 1 ? 404 : 200 });
  };
  assert.equal(await installDemoWorkflow({ ...config, fetchImpl }), 'created');
  assert.equal(calls[0].url, 'http://kestra:8080/api/v1/main/flows/demo/demo');
  assert.equal(calls[1].url, 'http://kestra:8080/api/v1/main/flows');
  assert.equal(calls[1].options.method, 'POST');
  assert.equal(calls[1].options.headers['Content-Type'], 'application/x-yaml');
  assert.equal(calls[1].options.body, config.workflow);
});
test('restarting retains the existing workflow without overwriting edits', async () => {
  let calls = 0;
  assert.equal(
    await installDemoWorkflow({
      ...config,
      fetchImpl: async () => {
        calls++;
        return Response.json({ id: 'demo', description: 'User edits', revision: 7 });
      },
    }),
    'retained',
  );
  assert.equal(calls, 1);
});
test('the work flow is imported under its own namespace and retained later', async () => {
  const calls = [];
  const options = {
    ...config,
    namespace: 'agent_workflows',
    id: 'work',
    workflow: 'id: work\nnamespace: agent_workflows\n',
    fetchImpl: async (url, request) => {
      calls.push({ url, request });
      return new Response('{}', { status: calls.length === 1 ? 404 : 200 });
    },
  };
  assert.equal(await installWorkflow(options), 'created');
  assert.equal(calls[0].url, 'http://kestra:8080/api/v1/main/flows/agent_workflows/work');
  assert.equal(calls[1].request.body, options.workflow);
  const existing = await installWorkflow({
    ...options,
    fetchImpl: async (url) => {
      assert.equal(url, calls[0].url);
      return Response.json({ id: 'work', revision: 3 });
    },
  });
  assert.equal(existing, 'retained');
});
test('authentication and server failures do not trigger creation', async () => {
  for (const status of [401, 403, 500, 503]) {
    let calls = 0;
    await assert.rejects(
      installDemoWorkflow({
        ...config,
        fetchImpl: async () => {
          calls++;
          return new Response('private server detail', { status });
        },
      }),
      new RegExp(`lookup failed \\(HTTP ${status}\\)`),
    );
    assert.equal(calls, 1);
  }
});
test('invalid workflows fail without exposing server details or credentials', async () => {
  let calls = 0;
  await assert.rejects(
    installDemoWorkflow({
      ...config,
      fetchImpl: async () => {
        calls++;
        return new Response('private server detail', { status: calls === 1 ? 404 : 422 });
      },
    }),
    (error) =>
      error.message.includes('HTTP 422') &&
      !error.message.includes('private') &&
      !error.message.includes(config.password),
  );
});
test('missing credentials fail before any HTTP call', async () => {
  await assert.rejects(
    installDemoWorkflow({
      ...config,
      password: '',
      fetchImpl: () => assert.fail('Unexpected request'),
    }),
    /Configure KESTRA/,
  );
});

test('managed controllers are updated without replacing the work flow', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return Response.json({ id: 'work_loop' });
  };
  assert.equal(await installWorkflow({ ...config, namespace: 'agent_workflows', id: 'work_loop', managed: true, fetchImpl }), 'updated');
  assert.equal(calls[1].url, 'http://kestra:8080/api/v1/main/flows/agent_workflows/work_loop');
  assert.equal(calls[1].options.method, 'PUT');
  assert.equal(calls[1].options.body, config.workflow);
  assert.equal(await installWorkflow({ ...config, namespace: 'agent_workflows', id: 'work', fetchImpl }), 'retained');
  assert.equal(calls.length, 3);
});

test('managed controllers are created on first installation', async () => {
  const calls = [];
  assert.equal(await installWorkflow({
    ...config, namespace: 'agent_workflows', id: 'work_loop', managed: true,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response('{}', { status: calls.length === 1 ? 404 : 200 });
    },
  }), 'created');
  assert.equal(calls[1].options.method, 'POST');
});

test('managed flow update failures are reported', async () => {
  let calls = 0;
  await assert.rejects(installWorkflow({
    ...config, namespace: 'agent_workflows', id: 'work_loop', managed: true,
    fetchImpl: async () => new Response('{}', { status: ++calls === 1 ? 200 : 422 }),
  }), /import failed \(HTTP 422\)/);
});

test('project configuration is uploaded unchanged as a namespace file', async () => {
  const contents = 'orchestration:\n  workLoop:\n    intervalSeconds: 17\n';
  let observed;
  await uploadNamespaceFile({ ...config, namespace: 'agent_workflows', path: 'agent-workflows.yaml', contents,
    fetchImpl: async (url, options) => {
      observed = { url, options };
      return new Response('', { status: 200 });
    },
  });
  assert.equal(observed.url, 'http://kestra:8080/api/v1/main/namespaces/agent_workflows/files?path=agent-workflows.yaml');
  assert.equal(observed.options.method, 'POST');
  assert.equal((await observed.options.body.get('fileContent').text()), contents);
});

test('namespace upload failures are reported', async () => {
  await assert.rejects(uploadNamespaceFile({ ...config, namespace: 'agent_workflows', path: 'agent-workflows.yaml', contents: '',
    fetchImpl: async () => new Response('', { status: 422 }),
  }), /namespace file upload failed \(HTTP 422\)/);
});
