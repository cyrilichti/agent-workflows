import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { readItem, normalizeItemReference } from '../../commands/read-item.ts';

function createFixture(t: test.TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'linear-work-item-'));
  const previousPath = process.env.PATH;
  t.after(() => {
    process.env.PATH = previousPath;
    rmSync(root, { recursive: true, force: true });
  });
  writeFileSync(
    join(root, 'linear'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const root = ${JSON.stringify(root)};
const args = process.argv.slice(2);
fs.appendFileSync(root + '/calls.jsonl', JSON.stringify(args) + '\\n');
let file = '/view.json';
if (args[0] === 'api') {
  const query = fs.readFileSync(0, 'utf8');
  file = query.includes('SearchItems') ? '/search.json' : '/context.json';
}
process.stdout.write(fs.readFileSync(root + file));
`,
    { mode: 0o755 },
  );
  process.env.PATH = `${root}:${previousPath}`;
  writeFileSync(
    join(root, 'context.json'),
    JSON.stringify({
      data: {
        issue: {
          id: 'uuid',
          identifier: 'ICY-133',
          state: { id: 'state', name: 'Todo', type: 'unstarted' },
          team: { name: 'Acme' },
          project: { name: 'Project' },
        },
      },
    }),
  );
  const view = {
    title: 'Fix CTA',
    description: '',
    url: 'https://linear.app/acme/issue/ICY-133/fix',
    labels: [{ name: 'agent-planned' }],
    attachments: [{ id: 'attachment-1' }],
    documents: [{ id: 'document-1' }],
    comments: [
      {
        id: 'c',
        body: 'Draft PR: https://github.com/acme/repo/pull/7\nAgent-Workflows-Plan: plans/cta.plan.md',
      },
    ],
  };
  writeFileSync(join(root, 'view.json'), JSON.stringify(view));
  writeFileSync(
    join(root, 'search.json'),
    JSON.stringify({
      data: {
        issues: {
          nodes: [
            {
              id: 'uuid',
              title: 'Fix CTA',
              state: { name: 'Todo' },
              team: { name: 'Acme' },
              project: null,
            },
          ],
        },
      },
    }),
  );
  return { root, view };
}

test('Linear read normalizes UUID context and reads comments once through the native identifier', (t) => {
  const { root } = createFixture(t);
  const item = readItem('linear', 'uuid');
  assert.equal(item.identifier, 'ICY-133');
  assert.equal(item.closed, false);
  assert.equal(item.description, '');
  assert.deepEqual(item.labels, ['agent-planned']);
  assert.deepEqual(item.attachments, [{ id: 'attachment-1' }]);
  assert.deepEqual(item.linked_resources, [{ id: 'document-1' }]);
  assert.deepEqual(item.request_backlinks, ['https://github.com/acme/repo/pull/7']);
  const calls = readFileSync(join(root, 'calls.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => {
      return JSON.parse(line);
    });
  assert.deepEqual(calls, [
    ['api', '--variable', 'id=uuid', '--no-input'],
    ['issue', 'view', 'ICY-133', '--json', '--no-input'],
  ]);
});

test('Linear read rejects missing comments and GraphQL partial errors', (t) => {
  const { root, view } = createFixture(t);
  writeFileSync(join(root, 'view.json'), JSON.stringify({ ...view, comments: null }));
  assert.throws(() => {
    return readItem('linear', 'ICY-133');
  }, /comments/);
  writeFileSync(join(root, 'context.json'), JSON.stringify({ errors: [{ message: 'Denied' }] }));
  assert.throws(() => {
    return readItem('linear', 'ICY-133');
  }, /context/);
});

test('native item URLs normalize and reject cross-provider hosts or shapes', () => {
  assert.equal(
    normalizeItemReference('linear', 'https://linear.app/acme/issue/ICY-133/fix'),
    'ICY-133',
  );
  assert.equal(normalizeItemReference('clickup', 'https://app.clickup.com/t/abc'), 'abc');
  assert.throws(() => {
    return normalizeItemReference('linear', 'https://app.clickup.com/t/abc');
  }, /URL/);
  assert.throws(() => {
    return normalizeItemReference('clickup', 'https://app.clickup.com/t/abc/extra');
  }, /URL/);
});

test('installed standalone command prepares one context and writes the exact approved plan under .agents', (t) => {
  const { root, view } = createFixture(t);
  const content = `# Fix CTA\n\n**Ticket :** [ICY-133](${view.url})\n\n## Steps\n\n1. ○ Fix color\n`;
  writeFileSync(
    join(root, 'view.json'),
    JSON.stringify({
      ...view,
      comments: [{ id: 'p', body: `Agent-Workflows-Approved-Plan:\n\n${content}` }],
    }),
  );
  const project = join(root, 'project');
  mkdirSync(join(project, '.agents/workflows'), { recursive: true });
  // A consuming project can have its own commands directory alongside .agents.
  mkdirSync(join(project, 'commands'));
  for (const directory of ['commands', 'providers']) {
    cpSync(resolve(directory), join(project, '.agents', directory), { recursive: true });
  }
  writeFileSync(join(project, 'agent-workflows.yaml'), 'mcp:\n  item:\n    provider: linear\n');
  const result = spawnSync(process.execPath, ['../commands/prepare-delivery-context.ts', 'uuid'], {
    cwd: join(project, '.agents/workflows'),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(output), ['status', 'work_mode', 'delivery_context']);
  assert.equal(output.work_mode, 'new');
  assert.match(
    output.delivery_context.plan,
    /^\.agents\/plans\/\d{4}-\d{2}-\d{2}-fix-cta\.plan\.md$/,
  );
  assert.equal(readFileSync(join(project, output.delivery_context.plan), 'utf8'), content);
  assert.equal(output.delivery_context.item.id, 'uuid');
  assert.equal(output.delivery_context.item.comments.length, 1);
  const calls = readFileSync(join(root, 'calls.jsonl'), 'utf8').trim().split('\n');
  assert.equal(calls.length, 2);
  const searched = spawnSync(
    process.execPath,
    ['../commands/prepare-delivery-context.ts', '--query', 'Fix CTA'],
    {
      cwd: join(project, '.agents/workflows'),
      encoding: 'utf8',
    },
  );
  assert.equal(searched.status, 0, searched.stdout + searched.stderr);
  const searchedContext = JSON.parse(searched.stdout).delivery_context;
  assert.equal(searchedContext.item.id, 'uuid');
  assert.match(searchedContext.plan, /-fix-cta-2\.plan\.md$/);
  assert.equal(readFileSync(join(project, searchedContext.plan), 'utf8'), content);

  const missing = spawnSync(process.execPath, ['../commands/prepare-delivery-context.ts'], {
    cwd: join(project, '.agents/workflows'),
    encoding: 'utf8',
  });
  assert.equal(missing.status, 1);
  assert.deepEqual(JSON.parse(missing.stdout), {
    status: 'failed',
    stage: 'resolve_item',
    reason: 'Supply an item reference or title query.',
  });
  assert.equal(readFileSync(join(root, 'calls.jsonl'), 'utf8').trim().split('\n').length, 5);

  const ready = spawnSync(
    process.execPath,
    ['../commands/prepare-delivery-context.ts', '--require-linked-request', 'uuid'],
    { cwd: join(project, '.agents/workflows'), encoding: 'utf8' },
  );
  assert.equal(ready.status, 1);
  assert.match(JSON.parse(ready.stdout).reason, /no linked pull or merge request/i);
});
