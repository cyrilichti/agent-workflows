import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parseItemArguments, resolveExistingItem, resolveItemContext } from './resolve-existing-item.ts';

function createFixture(t: test.TestContext, provider: 'linear' | 'clickup') {
  const root = mkdtempSync(join(tmpdir(), 'resolve-work-item-'));
  const previous = process.env.PATH;
  t.after(() => {
    process.env.PATH = previous;
    rmSync(root, { recursive: true, force: true });
  });
  writeFileSync(
    join(root, provider === 'linear' ? 'linear' : 'clickup-cli'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const root = ${JSON.stringify(root)};
fs.writeFileSync(root + '/args.json', JSON.stringify(process.argv.slice(2)));
if (process.argv[2] === 'api') {
  fs.writeFileSync(root + '/query', fs.readFileSync(0, 'utf8'));
}
const response = JSON.parse(fs.readFileSync(root + '/response.json', 'utf8'));
const queryArg = process.argv.find((arg) => arg.startsWith('query='));
const selected = response.byQuery
  ? response.byQuery[queryArg?.slice(6)] ?? { data: { issues: { nodes: [] } } }
  : response;
process.stdout.write(JSON.stringify(selected));
`,
    { mode: 0o755 },
  );
  process.env.PATH = `${root}:${previous}`;
  return {
    respond(value: unknown) {
      writeFileSync(join(root, 'response.json'), JSON.stringify(value));
    },
    readArgs() {
      return JSON.parse(readFileSync(join(root, 'args.json'), 'utf8')) as string[];
    },
  };
}

test('explicit references resolve without searching and absent input stops without questions', () => {
  assert.equal(resolveExistingItem('linear', 'ICY-133', 'ignored'), 'ICY-133');
  assert.equal(resolveExistingItem('clickup', 'https://app.clickup.com/t/abc'), 'abc');
  assert.throws(() => {
    return resolveExistingItem('linear');
  }, /reference or title query/i);
});

test('CLI accepts the shared positional and --query item signatures', () => {
  assert.deepEqual(parseItemArguments(['ICY-123']), { reference: 'ICY-123', query: '' });
  assert.deepEqual(parseItemArguments(['https://linear.app/icy/issue/ICY-123']), {
    reference: 'https://linear.app/icy/issue/ICY-123', query: '',
  });
  assert.deepEqual(parseItemArguments(['--query', 'Refactor /write']), {
    reference: '', query: 'Refactor /write',
  });
  assert.throws(() => parseItemArguments([]), /Supply an item/);
  assert.throws(() => parseItemArguments(['--query']), /Supply an item/);
});

test('context resolution returns candidates for ambiguous title matches', (t) => {
  const f = createFixture(t, 'linear');
  f.respond({ data: { issues: { nodes: [
    { id: 'a', title: 'Refactor write', state: { name: 'Todo' },
      team: { name: 'Acme' }, project: null },
    { id: 'b', title: 'Refactor write flow', state: { name: 'Todo' },
      team: { name: 'Acme' }, project: null },
  ] } } });
  const result = resolveItemContext('linear', '', 'Refactor write');
  assert.equal(result.status, 'ambiguous');
  assert.deepEqual(result.candidates?.map(candidate => candidate.item_id), ['a', 'b']);
});

test('Linear title search resolves a unique match and stops on empty or ambiguous results', (t) => {
  const f = createFixture(t, 'linear');
  const issue = {
    id: 'uuid',
    title: 'Fix CTA',
    state: { name: 'Todo' },
    team: { name: 'Acme' },
    project: null,
  };
  f.respond({ data: { issues: { nodes: [issue] } } });
  assert.equal(resolveExistingItem('linear', '', 'Fix CTA'), 'uuid');
  assert.deepEqual(f.readArgs(), ['api', '--variable', 'query=Fix CTA', '--no-input']);
  f.respond({ data: { issues: { nodes: [] } } });
  assert.throws(() => {
    return resolveExistingItem('linear', '', 'Fix CTA');
  }, /No item matches/);
  f.respond({ data: { issues: { nodes: [issue, { ...issue, id: 'uuid-2' }] } } });
  assert.throws(() => {
    return resolveExistingItem('linear', '', 'Fix CTA');
  }, /ambiguous/i);
  f.respond({ errors: [{ message: 'Denied' }] });
  assert.throws(() => {
    return resolveExistingItem('linear', '', 'Fix CTA');
  }, /search/i);
});

test('Linear title search finds a title when code backticks are omitted', (t) => {
  const f = createFixture(t, 'linear');
  const title = 'Refondre `/done` en parcours standalone sans confirmation';
  f.respond({ byQuery: {
    [title]: { data: { issues: { nodes: [{ id: 'issue-135', title,
      state: { name: 'Backlog' }, team: { name: 'ICY' }, project: null }] } } },
  } });
  assert.equal(resolveExistingItem('linear', '',
    'Refondre /done en parcours standalone sans confirmation'), 'issue-135');
});

test('ClickUp title search normalizes whitespace and stops on ambiguous first-page results', (t) => {
  const f = createFixture(t, 'clickup');
  const task = {
    id: 'abc',
    name: '  Fix   CTA ',
    status: { status: 'open' },
    list: { name: 'Queue' },
  };
  f.respond([{ ...task, id: 'other', name: 'Unrelated' }, task]);
  assert.equal(resolveExistingItem('clickup', '', 'fix cta'), 'abc');
  assert.deepEqual(f.readArgs(), [
    'task',
    'search',
    '--page',
    '0',
    '--include-closed',
    '--subtasks',
    '--output',
    'json',
  ]);
  f.respond([task, { ...task, id: 'second', name: 'Fix CTA hover' }]);
  assert.throws(() => {
    return resolveExistingItem('clickup', '', 'fix cta');
  }, /ambiguous/i);
  f.respond([]);
  assert.throws(() => {
    return resolveExistingItem('clickup', '', 'fix cta');
  }, /first page/i);
});
