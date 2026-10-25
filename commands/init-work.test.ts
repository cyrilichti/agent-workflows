import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const gitCli = `#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
appendFileSync(join(process.env.TEST_ROOT, 'git.jsonl'), JSON.stringify(args) + '\\n');
function output(text) {
  process.stdout.write(text + '\\n');
}
if (args[0] === 'branch' && args[1] === '--show-current') {
  output('topic');
} else if (args[0] === 'config' && args[1] === '--get') {
  if (args[2] === 'branch.topic.remote') {
    output('origin');
  } else {
    process.exitCode = 1;
  }
} else if (args[0] === 'remote' && args[1] === 'get-url') {
  output('https://github.com/acme/repo.git');
} else if (args[0] === 'ls-remote') {
  output('ref: refs/heads/main\\tHEAD');
} else if (args[0] === 'status' && process.env.TEST_DIRTY === '1') {
  output(' M file.txt');
} else if (args[0] === 'switch' || args[0] === 'pull' ||
           args[0] === 'status' || args[0] === 'commit' || args[0] === 'push') {
  // Successful Git mutation or clean status.
} else {
  process.stderr.write('Unexpected git command: ' + args.join(' ') + '\\n');
  process.exitCode = 2;
}
`;

const childCommand = `import { appendFileSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const name = basename(process.argv[1]);
const input = JSON.parse(readFileSync(0, 'utf8'));
appendFileSync(join(process.env.TEST_ROOT, 'commands.jsonl'),
  JSON.stringify({ name, input }) + '\\n');
if (name === 'transition-item-status.ts') {
  if (process.env.TEST_TRANSITION_FAILURE === '1') {
    process.stdout.write(JSON.stringify({
      status: 'failed', stage: 'start_item', reason: 'Multiple active statuses are available.',
    }) + '\\n');
    process.exitCode = 1;
  } else {
    process.stdout.write(JSON.stringify({
      status: 'transitioned', resulting_status: { id: 'active', name: 'En cours' },
    }) + '\\n');
  }
} else if (name === 'create-request.ts') {
  process.stdout.write(JSON.stringify({
    status: 'created',
    request: { kind: 'pull_request', url: 'https://github.com/acme/repo/pull/7',
      source_branch: input.source_branch, target_branch: input.target_branch },
  }) + '\\n');
} else if (name === 'link-request-to-item.ts') {
  process.stdout.write(JSON.stringify({ status: 'linked', backlink: { id: 'comment-1' } }) + '\\n');
}
`;

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'init-work-'));
  const commands = join(root, 'commands');
  const bin = join(root, 'bin');
  mkdirSync(commands);
  mkdirSync(bin);
  copyFileSync(resolve('commands/init-work.ts'), join(commands, 'init-work.ts'));
  for (const name of ['transition-item-status', 'create-request', 'link-request-to-item']) {
    writeFileSync(join(commands, `${name}.ts`), childCommand);
  }
  writeFileSync(join(bin, 'git'), gitCli, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, TEST_ROOT: root };
  return {
    root,
    run(extraEnv: Record<string, string> = {}) {
      return spawnSync(process.execPath, [
        join(commands, 'init-work.ts'),
        'ITEM-1', 'Réparer le plan', 'Fix a bug', 'plans/plan.md',
      ], { cwd: root, env: { ...env, ...extraEnv }, encoding: 'utf8' });
    },
    gitCalls() {
      try {
        return readFileSync(join(root, 'git.jsonl'), 'utf8').trim().split('\n')
          .map(line => JSON.parse(line) as string[]);
      } catch {
        return [];
      }
    },
    commandCalls() {
      return readFileSync(join(root, 'commands.jsonl'), 'utf8').trim().split('\n')
        .map(line => JSON.parse(line) as { name: string; input: Record<string, unknown> });
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test('init-work performs one transition, branch setup, request creation, and backlink', () => {
  const f = fixture();
  try {
    const result = f.run();
    assert.equal(result.status, 0, result.stdout);
    const output = JSON.parse(result.stdout);
    assert.equal(output.branch, 'fix/reparer-le-plan');
    assert.equal(output.target_branch, 'main');
    assert.equal(output.request.url, 'https://github.com/acme/repo/pull/7');
    assert.equal(output.resulting_status.name, 'En cours');
    assert.deepEqual(f.commandCalls().map(call => call.name),
      ['transition-item-status.ts', 'create-request.ts', 'link-request-to-item.ts']);
    assert.deepEqual(f.commandCalls().at(-1)?.input, {
      item_id: 'ITEM-1', request_kind: 'pull_request',
      request_url: 'https://github.com/acme/repo/pull/7',
      plan_reference: 'plans/plan.md',
    });
    assert.deepEqual(f.gitCalls().filter(args => ['switch', 'pull', 'commit', 'push'].includes(args[0]!)), [
      ['switch', 'main'],
      ['pull', '--ff-only'],
      ['switch', '-c', 'fix/reparer-le-plan'],
      ['commit', '--allow-empty', '-m', 'Initialize Réparer le plan'],
      ['push', '--set-upstream', 'origin', 'fix/reparer-le-plan'],
    ]);
  } finally {
    f.cleanup();
  }
});

test('init-work stops before Git when status transition is ambiguous', () => {
  const f = fixture();
  try {
    const result = f.run({ TEST_TRANSITION_FAILURE: '1' });
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).stage, 'start_item');
    assert.deepEqual(f.commandCalls().map(call => call.name), ['transition-item-status.ts']);
    assert.deepEqual(f.gitCalls(), []);
  } finally {
    f.cleanup();
  }
});

test('init-work stops before branch creation when the base remains dirty', () => {
  const f = fixture();
  try {
    const result = f.run({ TEST_DIRTY: '1' });
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).stage, 'prepare_base');
    assert.deepEqual(f.commandCalls().map(call => call.name), ['transition-item-status.ts']);
    assert.equal(f.gitCalls().some(args => args[0] === 'commit' || args[0] === 'push'), false);
  } finally {
    f.cleanup();
  }
});
