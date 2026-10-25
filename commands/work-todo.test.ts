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
if (args[0] === 'status') {
  if (process.env.TEST_DIRTY === '1') process.stdout.write(' M other.txt\\n');
} else if (args[0] === 'diff') {
  process.exitCode = process.env.TEST_STAGED === '1' ? 1 : 0;
} else if (args[0] === 'rev-parse') {
  process.stdout.write('abc123\\n');
} else if (args[0] === 'push' && process.env.TEST_PUSH_FAIL === '1') {
  process.stderr.write('push rejected\\n');
  process.exitCode = 1;
} else if (args[0] !== 'commit' && args[0] !== 'push') {
  process.stderr.write('Unexpected git command: ' + args.join(' ') + '\\n');
  process.exitCode = 2;
}
`;

function fixture(plan: string) {
  const root = mkdtempSync(join(tmpdir(), 'work-todo-'));
  mkdirSync(join(root, 'commands'));
  mkdirSync(join(root, 'plans'));
  mkdirSync(join(root, 'bin'));
  for (const name of ['work-todo-plan', 'work-next-todo', 'work-complete-todo']) {
    copyFileSync(resolve(`commands/${name}.ts`), join(root, 'commands', `${name}.ts`));
  }
  writeFileSync(join(root, 'plans', 'work.plan.md'), plan);
  writeFileSync(join(root, 'bin', 'git'), gitCli, { mode: 0o755 });
  const env = { ...process.env, TEST_ROOT: root, PATH: `${join(root, 'bin')}:${process.env.PATH}` };
  return {
    run(name: string, args: string[], input = '', extraEnv: Record<string, string> = {}) {
      return spawnSync(process.execPath, [join(root, 'commands', name), ...args], {
        cwd: root, env: { ...env, ...extraEnv }, input, encoding: 'utf8',
      });
    },
    plan() {
      return readFileSync(join(root, 'plans', 'work.plan.md'), 'utf8');
    },
    gitCalls(): string[][] {
      try {
        return readFileSync(join(root, 'git.jsonl'), 'utf8').trim().split('\n')
          .map(line => JSON.parse(line) as string[]);
      } catch {
        return [];
      }
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

const plan = `# Work

## Steps

1. ○ First change

2. ○ Second change

## Validation

- [ ] Check the result
`;
const planPath = 'plans/work.plan.md';

test('findings are persisted once with complete provenance before selecting a todo', () => {
  const f = fixture(plan.replace('1. ○ First change', '1. ✓ First change')
    .replace('2. ○ Second change', '2. ✓ Second change'));
  try {
    const finding = {
      workflow: 'inspect', id: 'finding-1', head_sha: 'abc123',
      finding: 'First line\n~~~~yaml\n<detail> & text', todo: 'Fix the reviewed issue.',
    };
    const first = f.run('work-next-todo.ts', [planPath], JSON.stringify([finding]));
    assert.equal(first.status, 0, first.stdout);
    assert.deepEqual(JSON.parse(first.stdout), {
      status: 'todo', todo: { number: 3, state: 'in_progress', text: finding.todo },
    });
    assert.match(f.plan(), /3\. ◐ Fix the reviewed issue\./);
    assert.match(f.plan(), /finding: \|-\n       First line\n       ~~~~yaml\n       <detail> & text/);
    assert.match(f.plan(), /~~~~~yaml/);
    assert.match(f.plan(), /## Validation\n\n- \[ \] Check the result/);

    const repeated = f.run('work-next-todo.ts', [planPath], JSON.stringify([finding]));
    assert.equal(repeated.status, 0, repeated.stdout);
    assert.equal((f.plan().match(/corrective_source:/g) ?? []).length, 1);
  } finally {
    f.cleanup();
  }
});

test('completing a staged todo commits, pushes, and selects the next todo', () => {
  const f = fixture(plan.replace('1. ○ First change', '1. ◐ First change'));
  try {
    const result = f.run('work-complete-todo.ts',
      [planPath, '1', 'fix: first change'], '', { TEST_STAGED: '1' });
    assert.equal(result.status, 0, result.stdout);
    assert.deepEqual(JSON.parse(result.stdout), {
      status: 'todo', todo: { number: 2, state: 'in_progress', text: 'Second change' },
      todo_number: 1, commit: 'abc123',
    });
    assert.match(f.plan(), /1\. ✓ First change/);
    assert.match(f.plan(), /2\. ◐ Second change/);
    assert.deepEqual(f.gitCalls().filter(args => ['commit', 'push'].includes(args[0]!)), [
      ['commit', '-m', 'fix: first change'], ['push'],
    ]);
  } finally {
    f.cleanup();
  }
});

test('completing a todo without staged changes does not commit or push', () => {
  const f = fixture(plan.replace('1. ○ First change', '1. ◐ First change')
    .replace('2. ○ Second change', '2. ⊘ Second change'));
  try {
    const result = f.run('work-complete-todo.ts', [planPath, '1']);
    assert.equal(result.status, 0, result.stdout);
    assert.deepEqual(JSON.parse(result.stdout), { status: 'ready', todo_number: 1 });
    assert.match(f.plan(), /1\. ✓ First change/);
    assert.equal(f.gitCalls().some(args => ['commit', 'push'].includes(args[0]!)), false);
  } finally {
    f.cleanup();
  }
});

test('staged changes require a commit message before committing or changing the plan', () => {
  const f = fixture(plan.replace('1. ○ First change', '1. ◐ First change'));
  try {
    const result = f.run('work-complete-todo.ts', [planPath, '1'], '',
      { TEST_STAGED: '1' });
    assert.equal(result.status, 1);
    assert.deepEqual(JSON.parse(result.stdout), {
      status: 'failed', stage: 'commit_todo',
      reason: 'A Conventional Commit message is required for staged changes.',
    });
    assert.match(f.plan(), /1\. ◐ First change/);
    assert.equal(f.gitCalls().some(args => ['commit', 'push'].includes(args[0]!)), false);
  } finally {
    f.cleanup();
  }
});

test('a failed push reports the completed commit and leaves the next todo pending', () => {
  const f = fixture(plan.replace('1. ○ First change', '1. ◐ First change'));
  try {
    const result = f.run('work-complete-todo.ts',
      [planPath, '1', 'fix: first change'], '',
      { TEST_STAGED: '1', TEST_PUSH_FAIL: '1' });
    assert.equal(result.status, 1);
    assert.deepEqual(JSON.parse(result.stdout), {
      status: 'failed', stage: 'push_todo', reason: 'push rejected',
      commit: 'abc123', todo_number: 1,
    });
    assert.match(f.plan(), /1\. ✓ First change/);
    assert.match(f.plan(), /2\. ○ Second change/);
  } finally {
    f.cleanup();
  }
});
