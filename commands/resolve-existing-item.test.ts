import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { resolveExistingItem } from './resolve-existing-item.ts';

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
process.stdout.write(fs.readFileSync(root + '/response.json'));
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
