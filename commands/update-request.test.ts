import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const cli = `#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
const args = process.argv.slice(2);
const file = process.env.TEST_REQUEST_STATE;
const state = JSON.parse(readFileSync(file, 'utf8'));
appendFileSync(process.env.TEST_REQUEST_CALLS, JSON.stringify({ program: basename(process.argv[1]), args }) + '\\n');
if (args[0] === 'api' && !args.includes('PATCH')) {
  process.stdout.write(JSON.stringify(state));
} else if (basename(process.argv[1]) === 'gh' && args[0] === 'api') {
  const patch = JSON.parse(readFileSync(0, 'utf8'));
  Object.assign(state, patch);
  writeFileSync(file, JSON.stringify(state));
} else if (basename(process.argv[1]) === 'gh' && args[0] === 'pr' && args[1] === 'ready') {
  state.draft = false;
  writeFileSync(file, JSON.stringify(state));
} else if (basename(process.argv[1]) === 'glab' && args[0] === 'mr' && args[1] === 'update') {
  const description = args.indexOf('--description');
  const title = args.indexOf('--title');
  if (description >= 0) state.description = args[description + 1];
  if (title >= 0) state.title = args[title + 1];
  if (args.includes('--ready')) state.draft = false;
  writeFileSync(file, JSON.stringify(state));
} else {
  process.stderr.write('Unexpected request command');
  process.exitCode = 2;
}
`;

function fixture(t: test.TestContext, program: 'gh' | 'glab', state: object) {
  const root = mkdtempSync(join(tmpdir(), 'update-request-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, program), cli, { mode: 0o755 });
  writeFileSync(join(root, 'state.json'), JSON.stringify(state));
  const env = { ...process.env, PATH: `${root}:${process.env.PATH}`,
    TEST_REQUEST_STATE: join(root, 'state.json'), TEST_REQUEST_CALLS: join(root, 'calls.jsonl') };
  return {
    run(input: object) {
      return spawnSync(process.execPath, [resolve('commands/update-request.ts')], {
        env, input: JSON.stringify(input), encoding: 'utf8',
      });
    },
    state() { return JSON.parse(readFileSync(join(root, 'state.json'), 'utf8')); },
    calls() { return readFileSync(join(root, 'calls.jsonl'), 'utf8').trim().split('\n')
      .map(line => JSON.parse(line) as { program: string; args: string[] }); },
  };
}

test('GitHub description replacement and ready transition preserve the exact body', (t) => {
  const f = fixture(t, 'gh', {
    number: 7, state: 'open', merged: false, draft: true, title: 'Draft: Fix CTA',
    head: { ref: 'fix/cta', sha: 'abc' }, base: { ref: 'main' }, body: '',
    html_url: 'https://github.com/acme/repo/pull/7',
  });
  const request = { request_id: 7, kind: 'pull_request',
    url: 'https://github.com/acme/repo/pull/7', state: 'open', draft: true,
    title: 'Draft: Fix CTA', source_branch: 'fix/cta', target_branch: 'main',
    body: '', head_sha: 'abc' };
  const body = '# Plan\n\n- [x] Check\n';
  const replaced = f.run({ request, action: 'replace-description', body });
  assert.equal(replaced.status, 0);
  const updatedRequest = JSON.parse(replaced.stdout).request;
  assert.equal(f.run({ request: updatedRequest, action: 'mark-ready' }).status, 0);
  assert.equal(f.state().body, body);
  assert.equal(f.state().title, 'Fix CTA');
  assert.equal(f.state().draft, false);
  assert.equal(f.calls().filter(call => call.args.includes('PATCH')).length, 2);
  assert.equal(f.calls().filter(call => call.args[0] === 'pr').length, 1);
  assert.equal(f.calls().filter(call => call.args[0] === 'api' &&
    !call.args.includes('PATCH')).length, 0);
});

test('GitLab description replacement and ready transition use the same MR', (t) => {
  const f = fixture(t, 'glab', {
    iid: 8, state: 'opened', draft: true, title: 'Draft: Fix CTA',
    source_branch: 'fix/cta', target_branch: 'main', sha: 'abc', description: '',
    web_url: 'https://gitlab.example/acme/repo/-/merge_requests/8',
  });
  const request = { request_id: 8, kind: 'merge_request',
    url: 'https://gitlab.example/acme/repo/-/merge_requests/8',
    state: 'open', draft: true, title: 'Draft: Fix CTA',
    source_branch: 'fix/cta', target_branch: 'main', body: '', head_sha: 'abc' };
  const replaced = f.run({ request, action: 'replace-description', body: '# Plan' });
  assert.equal(replaced.status, 0);
  const updatedRequest = JSON.parse(replaced.stdout).request;
  assert.equal(f.run({ request: updatedRequest, action: 'mark-ready' }).status, 0);
  assert.equal(f.state().description, '# Plan');
  assert.equal(f.state().title, 'Fix CTA');
  assert.equal(f.state().draft, false);
  assert.equal(f.calls().filter(call => call.args[0] === 'mr').length, 2);
  assert.equal(f.calls().filter(call => call.args[0] === 'api').length, 0);
});
