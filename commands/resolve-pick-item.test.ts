import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import type { WorkItem } from './read-item.ts';
import { classifyPickItem } from './resolve-pick-item.ts';

const item: WorkItem = {
  id: 'uuid', identifier: 'ICY-143', title: 'Refactor `/pick`',
  description: 'Update the workflow.', url: 'https://linear.app/icy/issue/ICY-143',
  status: { name: 'Backlog' }, closed: false, destination: { team: 'ICY' },
  labels: ['agent-shaped'], comments: [], request_backlinks: [],
  attachments: [], linked_resources: [], relations: 'No relations',
};

test('pick eligibility gives closed and unavailable openness precedence', () => {
  assert.deepEqual(classifyPickItem({ ...item, closed: true,
    labels: ['agent-planned'] }), { status: 'ineligible', reason: 'closed',
    item: { ...item, closed: true, labels: ['agent-planned'] } });
  assert.equal(classifyPickItem({ ...item, closed: null }).reason,
    'openness_unavailable');
});

test('pick eligibility recognizes planned, shaped, and unshaped open items', () => {
  assert.equal(classifyPickItem({ ...item,
    labels: ['agent-shaped', 'agent-planned'] }).status, 'already_planned');
  assert.equal(classifyPickItem(item).status, 'eligible');
  assert.equal(classifyPickItem({ ...item, labels: [] }).reason,
    'missing_agent_shaped');
  assert.equal(classifyPickItem(item).item, item);
});

test('pick CLI resolves positional references and title queries with complete context', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'pick-item-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, 'linear'), `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(join(root, 'calls'))}, JSON.stringify(args) + '\\n');
if (args[0] === 'api' && args.some(arg => arg.startsWith('query='))) {
  process.stdout.write(JSON.stringify({data:{issues:{nodes:[{id:'uuid',
    title:'Refactor pick', state:{name:'Backlog'}, team:{name:'ICY'}}]}}}));
} else if (args[0] === 'api') {
  process.stdout.write(JSON.stringify({data:{issue:{id:'uuid', identifier:'ICY-143',
    state:{name:'Backlog',type:'backlog'},team:{name:'ICY'},project:null}}}));
} else if (args[0] === 'issue' && args[1] === 'view') {
  process.stdout.write(JSON.stringify({title:'Refactor pick',
    description:'Update the workflow.',url:'https://linear.app/icy/issue/ICY-143',
    labels:[{name:'agent-shaped'}],comments:[],attachments:[],documents:[]}));
} else if (args[0] === 'issue' && args[1] === 'relation') {
  process.stdout.write('No relations');
}
`, { mode: 0o755 });
  const command = join(import.meta.dirname, 'resolve-pick-item.ts');
  for (const args of [['ICY-143'], ['--query', 'Refactor pick']]) {
    const run = spawnSync(process.execPath, [command, ...args], {
      cwd: dirname(import.meta.dirname), encoding: 'utf8',
      env: { ...process.env, PATH: `${root}:${process.env.PATH}` },
    });
    assert.equal(run.status, 0, run.stdout + run.stderr);
    const result = JSON.parse(run.stdout);
    assert.equal(result.status, 'eligible');
    assert.equal(result.item.id, 'uuid');
    assert.deepEqual(result.item.labels, ['agent-shaped']);
    assert.deepEqual(result.item.comments, []);
    assert.equal(result.item.relations, 'No relations');
  }
  const calls = readFileSync(join(root, 'calls'), 'utf8').trim().split('\n')
    .map(line => JSON.parse(line) as string[]);
  assert.equal(calls.filter(args => args.some(arg => arg.startsWith('query='))).length, 1);
  assert.equal(calls.filter(args => args[1] === 'relation').length, 2);
});
