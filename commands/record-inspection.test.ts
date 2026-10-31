import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const sha = 'a'.repeat(40);
const url = 'https://github.com/acme/repo/pull/7';
const cli = `#!/usr/bin/env node
const fs = require('node:fs');
const statePath = process.env.TEST_INSPECTION_STATE;
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const args = process.argv.slice(2);
if (args[0] === 'api') {
  process.stdout.write(JSON.stringify({ data: { issue: { id: 'uuid-1', identifier: 'ICY-1',
    state: { id: 'review', name: 'Review', type: 'started' }, team: { id: 'team-1' },
    project: null } } }));
} else if (args[0] === 'issue' && args[1] === 'view') {
  process.stdout.write(JSON.stringify({ title: 'Task', description: '',
    url: 'https://linear.app/acme/issue/ICY-1', labels: [{ name: 'agent-inspected' }],
    comments: state.comments }));
} else if (args[0] === 'issue' && args[1] === 'comment') {
  state.calls++;
  state.comments.push({ id: 'inspection', body: fs.readFileSync(0, 'utf8') });
  fs.writeFileSync(statePath, JSON.stringify(state));
  process.stdout.write('inspection');
} else process.exit(2);
`;

test('inspection records the exact SHA once and verifies the item comment', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'record-inspection-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = join(root, 'bin');
  mkdirSync(bin);
  writeFileSync(join(root, 'agent-workflows.yaml'), 'mcp:\n  item:\n    provider: linear\n');
  writeFileSync(join(bin, 'linear'), cli, { mode: 0o755 });
  const statePath = join(root, 'state.json');
  writeFileSync(statePath, JSON.stringify({ calls: 0, comments: [] }));
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`,
    TEST_INSPECTION_STATE: statePath };
  const script = `import { recordInspection } from '${resolve('commands/record-inspection.ts')}';
process.stdout.write(JSON.stringify(recordInspection(process.argv[1],
  { item_id: 'ICY-1', request_url: '${url}', head_sha: '${sha}' })));`;
  for (let i = 0; i < 2; i++) {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script, root],
      { cwd: root, env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).status, 'recorded');
  }
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.equal(state.calls, 1);
  assert.equal(state.comments[0].body, `Agent-Workflows-Inspected: ${url} ${sha}`);
});
