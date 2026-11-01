import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const plan = '# Fix CTA\n\n## Steps\n\n1. ✓ Fix color\n\n## Validation\n\n- [x] Run tests\n';
const gitCli = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'status') {
} else if (args[0] === 'branch') {
  process.stdout.write('fix/cta\\n');
} else if (args[0] === 'rev-parse') {
  process.stdout.write('abc\\n');
} else if (args[0] === 'rev-list') {
  process.stdout.write('0\\t0\\n');
} else if (args[0] === 'config') {
  if (args[2] === 'branch.fix/cta.remote') process.stdout.write('origin\\n');
  else process.exitCode = 1;
} else if (args[0] === 'remote') {
  process.stdout.write('https://github.com/acme/repo.git\\n');
} else {
  process.stderr.write('Unexpected git command: ' + args.join(' '));
  process.exitCode = 2;
}
`;
const ghCli = `#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const file = process.env.TEST_REQUEST_STATE;
const state = JSON.parse(readFileSync(file, 'utf8'));
if (args[0] === 'api' && args.includes('PATCH')) {
  Object.assign(state, JSON.parse(readFileSync(0, 'utf8')));
  writeFileSync(file, JSON.stringify(state));
} else if (args[0] === 'api') {
  process.stdout.write(JSON.stringify(state));
} else if (args[0] === 'pr' && args[1] === 'ready') {
  state.draft = false;
  writeFileSync(file, JSON.stringify(state));
} else {
  process.exitCode = 2;
}
`;

function fixture(t: test.TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'update-request-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'commands'));
  mkdirSync(join(root, 'providers/github'), { recursive: true });
  mkdirSync(join(root, 'providers/gitlab'), { recursive: true });
  mkdirSync(join(root, 'bin'));
  mkdirSync(join(root, 'plans'));
  for (const name of ['update-request', 'resolve-request',
    'resolve-item-provider', 'resolve-version-repository']) {
    copyFileSync(resolve(`commands/${name}.ts`), join(root, 'commands', `${name}.ts`));
  }
  for (const provider of ['github', 'gitlab']) {
    for (const name of ['read-request', 'update-request']) {
      copyFileSync(resolve(`providers/${provider}/${name}.ts`),
        join(root, 'providers', provider, `${name}.ts`));
    }
  }
  writeFileSync(join(root, 'plans/cta.plan.md'), plan);
  writeFileSync(join(root, 'agent-workflows.yaml'), 'version:\n  provider: github\n');
  writeFileSync(join(root, 'bin/git'), gitCli, { mode: 0o755 });
  writeFileSync(join(root, 'bin/gh'), ghCli, { mode: 0o755 });
  writeFileSync(join(root, 'request.json'), JSON.stringify({
    number: 7, title: 'Draft: Fix CTA', state: 'open', merged: false, draft: true,
    head: { ref: 'fix/cta', sha: 'abc' }, base: { ref: 'main' }, body: '',
    html_url: 'https://github.com/acme/repo/pull/7',
  }));
  const env = { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`,
    TEST_REQUEST_STATE: join(root, 'request.json') };
  const context = { plan: 'plans/cta.plan.md', item: { id: 'ITEM-1' }, branch: 'fix/cta',
    request: { request_id: 7 } };
  return {
    root,
    run() { return spawnSync(process.execPath, [join(root, 'commands/update-request.ts')],
      { cwd: root, env, input: JSON.stringify(context), encoding: 'utf8' }); },
    state() { return JSON.parse(readFileSync(join(root, 'request.json'), 'utf8')); },
    planPath: join(root, 'plans/cta.plan.md'),
  };
}

test('request update promotes a completed plan and returns the same request context', (t) => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stdout);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, 'promoted');
  assert.equal(output.delivery_context.request.request_id, 7);
  assert.equal(f.state().body, plan);
  assert.equal(f.state().draft, false);
  assert.equal(f.state().title, 'Fix CTA');
});

test('request update accepts completed and cancelled todos', (t) => {
  const f = fixture(t);
  writeFileSync(f.planPath, plan.replace('## Validation', '2. ⊘ Drop obsolete step\n\n## Validation'));
  const result = f.run();
  assert.equal(result.status, 0, result.stdout);
  assert.equal(JSON.parse(result.stdout).status, 'promoted');
});

test('request update refuses pending, in-progress, or all-cancelled plans', (t) => {
  for (const steps of ['1. ✓ Fix color\n2. ○ Open step',
    '1. ✓ Fix color\n2. ◐ Active step', '1. ⊘ Drop obsolete step']) {
    const f = fixture(t);
    writeFileSync(f.planPath, plan.replace('1. ✓ Fix color', steps));
    const result = f.run();
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).stage, 'check_plan');
    assert.equal(f.state().body, '');
  }
});

test('request update stops before mutation when validation is unchecked', (t) => {
  const f = fixture(t);
  writeFileSync(f.planPath, plan.replace('[x]', '[ ]'));
  const result = f.run();
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).stage, 'check_plan');
  assert.equal(f.state().body, '');
  assert.equal(f.state().draft, true);
  assert.equal(existsSync(f.planPath), true);
});
