import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const gitCli = `#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
const args = process.argv.slice(2);
appendFileSync(join(process.env.TEST_ROOT, 'git.jsonl'), JSON.stringify(args) + '\\n');
if (args[0] === 'branch') {
  process.stdout.write('topic\\n');
} else if (args[0] === 'config') {
  if (args[2] === 'branch.topic.remote') {
    process.stdout.write('origin\\n');
  } else {
    process.exitCode = 1;
  }
} else if (args[0] === 'remote') {
  process.stdout.write(process.env.TEST_REMOTE + '\\n');
} else if (args[0] === 'switch') {
  if (process.env.TEST_SWITCH_FAILURE === '1') {
    process.stderr.write('switch failed\\n');
    process.exitCode = 1;
  }
} else if (args[0] === 'status') {
  if (process.env.TEST_DIRTY === '1') {
    process.stdout.write(' M file.txt\\n');
  }
}
`;

const ghCli = `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  number: 7, title: 'Fix item', state: 'open', merged: false, draft: true,
  head: { ref: process.env.TEST_REQUEST_BRANCH || 'feature/work', sha: 'a'.repeat(40) },
  base: { ref: 'main' }, body: '',
  html_url: 'https://github.com/acme/repo/pull/7',
}) + '\\n');
`;

const glabCli = `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  iid: 7, title: 'Fix item', state: 'opened', draft: true,
  source_branch: process.env.TEST_REQUEST_BRANCH || 'feature/work',
  target_branch: 'main', sha: 'a'.repeat(40), description: '',
  web_url: 'https://gitlab.example/acme/repo/-/merge_requests/7',
}) + '\\n');
`;

const transitionCommand = `import { appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const input = JSON.parse(readFileSync(0, 'utf8'));
appendFileSync(join(process.env.TEST_ROOT, 'transition.jsonl'), JSON.stringify(input) + '\\n');
process.stdout.write(JSON.stringify({
  status: 'transitioned', resulting_status: { id: 'active', name: 'In Progress' },
}) + '\\n');
`;

function fixture(provider: 'github' | 'gitlab') {
  const root = mkdtempSync(join(tmpdir(), 'work-resume-'));
  const commands = join(root, 'commands');
  const bin = join(root, 'bin');
  mkdirSync(commands);
  mkdirSync(bin);
  for (const name of ['work-resume', 'resolve-item-provider',
    'resolve-version-repository', 'resolve-request']) {
    copyFileSync(resolve(`commands/${name}.ts`), join(commands, `${name}.ts`));
  }
  for (const name of ['github', 'gitlab']) {
    const directory = join(root, 'providers', name);
    mkdirSync(directory, { recursive: true });
    copyFileSync(resolve(`providers/${name}/read-request.ts`),
      join(directory, 'read-request.ts'));
  }
  writeFileSync(join(commands, 'transition-item-status.ts'), transitionCommand);
  writeFileSync(join(bin, 'git'), gitCli, { mode: 0o755 });
  writeFileSync(join(bin, 'gh'), ghCli, { mode: 0o755 });
  writeFileSync(join(bin, 'glab'), glabCli, { mode: 0o755 });
  writeFileSync(join(root, 'agent-workflows.yaml'), `version:\n  provider: ${provider}\n`);
  const remote = provider === 'github'
    ? 'https://github.com/acme/repo.git'
    : 'https://gitlab.example/acme/repo.git';
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`,
    TEST_ROOT: root, TEST_REMOTE: remote };
  return {
    root,
    resolve(backlinks: string[]) {
      return spawnSync(process.execPath, [join(commands, 'resolve-request.ts')], {
        cwd: root, env, encoding: 'utf8',
        input: JSON.stringify({ request_backlinks: backlinks }),
      });
    },
    run(requestId: number, branch: string, extraEnv: Record<string, string> = {}) {
      return spawnSync(process.execPath, [join(commands, 'work-resume.ts'),
        'ITEM-1', String(requestId), branch], {
        cwd: root, env: { ...env, ...extraEnv }, encoding: 'utf8',
      });
    },
    gitCalls() {
      return readFileSync(join(root, 'git.jsonl'), 'utf8').trim().split('\n')
        .map(line => JSON.parse(line) as string[]);
    },
    transitionCalls() {
      try {
        return readFileSync(join(root, 'transition.jsonl'), 'utf8').trim().split('\n')
          .map(line => JSON.parse(line) as { item_id: string });
      } catch {
        return [];
      }
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test('resumed GitHub work resolves the exact backlink before switching and transitioning', () => {
  const f = fixture('github');
  try {
    const backlinks = [
      'https://other.example/acme/repo/pull/9',
      'https://github.com/acme/repo/pull/7',
    ];
    const resolved = f.resolve(backlinks);
    assert.equal(resolved.status, 0, resolved.stdout);
    const { request, branch } = JSON.parse(resolved.stdout);
    const result = f.run(request.request_id, branch);
    assert.equal(result.status, 0, result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.request.request_id, 7);
    assert.equal(output.branch, 'feature/work');
    assert.equal(output.resulting_status.name, 'In Progress');
    assert.deepEqual(f.gitCalls().filter(args => args[0] === 'switch' || args[0] === 'status'), [
      ['switch', '--no-guess', 'feature/work'], ['status', '--porcelain'],
    ]);
    assert.deepEqual(f.transitionCalls(), [{ item_id: 'ITEM-1' }]);
  } finally {
    f.cleanup();
  }
});

test('resumed GitLab work accepts the carried request ID', () => {
  const f = fixture('gitlab');
  try {
    const result = f.run(7, 'feature/work');
    assert.equal(result.status, 0, result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.request.kind, 'merge_request');
    assert.equal(output.request.state, 'open');
    assert.deepEqual(f.transitionCalls(), [{ item_id: 'ITEM-1' }]);
  } finally {
    f.cleanup();
  }
});

test('resumed work stops before item mutation when the switched worktree is dirty', () => {
  const f = fixture('github');
  try {
    const result = f.run(7, 'feature/work', { TEST_DIRTY: '1' });
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).stage, 'check_worktree');
    assert.deepEqual(f.transitionCalls(), []);
  } finally {
    f.cleanup();
  }
});

test('resumed work rejects a request on another source branch before switching', () => {
  const f = fixture('github');
  try {
    const result = f.run(7, 'feature/expected');
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).stage, 'resolve_request');
    assert.equal(f.gitCalls().some(args => args[0] === 'switch'), false);
    assert.deepEqual(f.transitionCalls(), []);
  } finally {
    f.cleanup();
  }
});
