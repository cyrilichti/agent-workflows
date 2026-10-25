import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import test from 'node:test';

const fakeCli = `#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const program = basename(process.argv[1]);
const args = process.argv.slice(2);
const input = readFileSync(0, 'utf8');
appendFileSync(join(process.env.TEST_ROOT, 'calls.jsonl'), JSON.stringify({ program, args, input }) + '\\n');

function output(value) {
  process.stdout.write(JSON.stringify(value) + '\\n');
}

if (program === 'clickup-cli') {
  if (args[0] === 'task' && args[1] === 'get') {
    output({ status: { status: 'Ouvert', type: 'open' }, list: { id: 'list-1' } });
  } else if (args[0] === 'list' && args[1] === 'get') {
    const statuses = [
      { id: 'open', status: 'Ouvert', type: 'open' },
      { id: 'active', status: 'En cours', type: 'custom' },
      { id: 'done', status: 'Terminé', type: 'closed' },
    ];
    if (process.env.TEST_AMBIGUOUS === '1') {
      statuses.push({ id: 'other-active', status: 'En examen', type: 'custom' });
    }
    output({ statuses });
  } else if (args[0] === 'task' && args[1] === 'update') {
    output({ status: { id: 'active', status: 'En cours', type: 'custom' } });
  } else if (args[0] === 'comment' && args[1] === 'create') {
    output({ id: 'comment-1' });
  } else {
    process.exit(2);
  }
} else if (program === 'linear') {
  if (args[0] === '--no-input' && args[1] === 'api') {
    const updated = existsSync(join(process.env.TEST_ROOT, 'linear-updated'));
    output({ data: { issue: {
      state: updated
        ? { id: 'active', name: 'En cours', type: 'started' }
        : { id: 'todo', name: 'À faire', type: 'unstarted' },
      team: { id: 'team-1', key: 'TEAM' },
    } } });
  } else if (args[0] === 'team' && args[1] === 'states') {
    output([
      { id: 'todo', name: 'À faire', type: 'unstarted' },
      { id: 'active', name: 'En cours', type: 'started' },
    ]);
  } else if (args[0] === 'issue' && args[1] === 'update') {
    writeFileSync(join(process.env.TEST_ROOT, 'linear-updated'), '');
  } else if (args[0] === 'issue' && args[1] === 'comment') {
    process.stdout.write('comment-2\\n');
  } else {
    process.exit(2);
  }
} else if (program === 'gh') {
  if (args[0] === 'pr' && args[1] === 'create') {
    process.stdout.write('https://github.com/acme/repo/pull/7\\n');
  } else if (args[0] === 'api') {
    output({
      number: 7, state: 'open', draft: process.env.TEST_BAD_DRAFT !== '1', title: 'ITEM-1: Plan',
      head: { ref: 'fix/plan' }, base: { ref: 'main' },
      body: '', html_url: 'https://github.com/acme/repo/pull/7',
    });
  } else {
    process.exit(2);
  }
} else if (program === 'glab') {
  if (args[0] === 'mr' && args[1] === 'create') {
    process.stdout.write('https://gitlab.example/acme/repo/-/merge_requests/8\\n');
  } else if (args[0] === 'mr' && args[1] === 'view') {
    output({
      iid: 8, state: 'opened', draft: true, title: 'ITEM-1: Plan',
      source_branch: 'fix/plan', target_branch: 'main',
      description: '', web_url: 'https://gitlab.example/acme/repo/-/merge_requests/8',
    });
  } else {
    process.exit(2);
  }
}
`;

function fixture(itemProvider: 'clickup' | 'linear', versionProvider: 'github' | 'gitlab') {
  const root = mkdtempSync(join(tmpdir(), 'work-commands-'));
  const bin = join(root, 'bin');
  mkdirSync(bin);
  mkdirSync(join(root, 'commands'));
  for (const name of ['resolve-item-provider', 'transition-item-status', 'create-request', 'link-request-to-item']) {
    copyFileSync(resolve(`commands/${name}.ts`), join(root, 'commands', `${name}.ts`));
  }
  for (const [provider, name] of [
    ['clickup', 'transition-item-status'], ['linear', 'transition-item-status'],
    ['clickup', 'add-request-backlink'], ['linear', 'add-request-backlink'],
    ['github', 'create-request'], ['gitlab', 'create-request'],
  ]) {
    const directory = join(root, 'providers', provider);
    mkdirSync(directory, { recursive: true });
    copyFileSync(resolve(`providers/${provider}/${name}.ts`), join(directory, `${name}.ts`));
  }
  writeFileSync(join(root, 'agent-workflows.yaml'),
    `mcp:\n  item:\n    provider: ${itemProvider}\n  version:\n    provider: ${versionProvider}\n`);
  for (const name of ['clickup-cli', 'linear', 'gh', 'glab']) {
    writeFileSync(join(bin, name), fakeCli, { mode: 0o755 });
  }
  const env = { ...process.env, TEST_ROOT: root, PATH: `${bin}:${process.env.PATH}` };
  return {
    root,
    env,
    run(name: string, input: unknown, extraEnv: Record<string, string> = {}) {
      return spawnSync(process.execPath, [join(root, 'commands', name)], {
        cwd: root, env: { ...env, ...extraEnv }, encoding: 'utf8', input: JSON.stringify(input),
      });
    },
    calls() {
      const path = join(root, 'calls.jsonl');
      try {
        return readFileSync(path, 'utf8').trim().split('\n').map(line =>
          JSON.parse(line) as { program: string; args: string[]; input: string });
      } catch {
        return [];
      }
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test('ClickUp transition uses native status type and stops before mutation on ambiguity', () => {
  const f = fixture('clickup', 'github');
  try {
    const input = { item_id: 'ITEM-1' };
    const result = f.run('transition-item-status.ts', input);
    assert.equal(result.status, 0, result.stdout);
    assert.equal(JSON.parse(result.stdout).resulting_status.name, 'En cours');
    assert.deepEqual(f.calls().at(-1)?.args,
      ['task', 'update', 'ITEM-1', '--status', 'En cours', '--output', 'json']);

    const before = f.calls().length;
    const ambiguous = f.run('transition-item-status.ts', input, { TEST_AMBIGUOUS: '1' });
    assert.equal(ambiguous.status, 1);
    assert.match(JSON.parse(ambiguous.stdout).reason, /Multiple active statuses/);
    assert.equal(f.calls().slice(before).some(call => call.args[1] === 'update'), false);
  } finally {
    f.cleanup();
  }
});

test('Linear transition uses native started type', () => {
  const f = fixture('linear', 'gitlab');
  try {
    const result = f.run('transition-item-status.ts', { item_id: 'ITEM-1' });
    assert.equal(result.status, 0, result.stdout);
    assert.equal(JSON.parse(result.stdout).resulting_status.id, 'active');
    assert.deepEqual(f.calls().find(call => call.args[1] === 'update')?.args,
      ['issue', 'update', 'ITEM-1', '--state', 'active', '--no-input']);
  } finally {
    f.cleanup();
  }
});

test('GitHub request and ClickUp backlink use the created request URL', () => {
  const f = fixture('clickup', 'github');
  try {
    const created = f.run('create-request.ts', {
      push_remote_url: 'https://github.com/acme/repo.git',
      source_branch: 'fix/plan', target_branch: 'main', plan_name: 'Plan', item_id: 'ITEM-1',
    });
    assert.equal(created.status, 0, created.stdout);
    const request = JSON.parse(created.stdout).request;
    assert.equal(request.url, 'https://github.com/acme/repo/pull/7');
    assert.equal(request.draft, true);
    const linked = f.run('link-request-to-item.ts', {
      item_id: 'ITEM-1', request_kind: request.kind, request_url: request.url,
      plan_reference: 'plans/plan.md',
    });
    assert.equal(linked.status, 0, linked.stdout);
    assert.equal(JSON.parse(linked.stdout).comment,
      'Draft PR: https://github.com/acme/repo/pull/7\n\nAgent-Workflows-Plan: plans/plan.md');
  } finally {
    f.cleanup();
  }
});

test('request verification failure preserves the created URL for recovery', () => {
  const f = fixture('clickup', 'github');
  try {
    const result = f.run('create-request.ts', {
      push_remote_url: 'https://github.com/acme/repo.git',
      source_branch: 'fix/plan', target_branch: 'main', plan_name: 'Plan', item_id: 'ITEM-1',
    }, { TEST_BAD_DRAFT: '1' });
    assert.equal(result.status, 1);
    const output = JSON.parse(result.stdout);
    assert.equal(output.stage, 'create_request');
    assert.equal(output.created_url, 'https://github.com/acme/repo/pull/7');
    assert.equal(output.request_id, 7);
  } finally {
    f.cleanup();
  }
});

test('GitLab request and Linear backlink use the created request URL', () => {
  const f = fixture('linear', 'gitlab');
  try {
    const created = f.run('create-request.ts', {
      push_remote_url: 'git@gitlab.example:acme/repo.git',
      source_branch: 'fix/plan', target_branch: 'main', plan_name: 'Plan', item_id: 'ITEM-1',
    });
    assert.equal(created.status, 0, created.stdout);
    const request = JSON.parse(created.stdout).request;
    assert.equal(request.url, 'https://gitlab.example/acme/repo/-/merge_requests/8');
    const linked = f.run('link-request-to-item.ts', {
      item_id: 'ITEM-1', request_kind: request.kind, request_url: request.url,
      plan_reference: 'plans/plan.md',
    });
    assert.equal(linked.status, 0, linked.stdout);
    assert.equal(f.calls().at(-1)?.input,
      'Draft MR: https://gitlab.example/acme/repo/-/merge_requests/8\n\nAgent-Workflows-Plan: plans/plan.md');
  } finally {
    f.cleanup();
  }
});
