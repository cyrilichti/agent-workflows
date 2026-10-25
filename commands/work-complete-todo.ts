import { spawnSync } from 'node:child_process';
import { basename, dirname } from 'node:path';
import { completeTodo, readPlan, selectNextTodo, writePlan } from './work-todo-plan.ts';

const parent = dirname(import.meta.dirname);
const root = basename(parent) === '.agents' ? dirname(parent) : parent;
let stage = 'complete_todo';
const completed: Record<string, unknown> = {};

function git(...args: string[]): string {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() ||
      `git exited with status ${result.status}.`);
  }
  return result.stdout.trim();
}

try {
  const [planPath, todoNumberText, commitMessage] = process.argv.slice(2);
  const todoNumber = Number(todoNumberText);
  const current = readPlan(root, planPath!);
  const completedPlan = completeTodo(current, todoNumber);

  stage = 'inspect_index';
  const diff = spawnSync('git', ['diff', '--cached', '--quiet'], {
    cwd: root, encoding: 'utf8',
  });
  if (diff.error) {
    throw diff.error;
  }
  if (diff.status === 1) {
    stage = 'commit_todo';
    if (!commitMessage?.trim()) {
      throw new Error('A Conventional Commit message is required for staged changes.');
    }
    git('commit', '-m', commitMessage);
    completed.commit = git('rev-parse', 'HEAD');
  } else if (diff.status !== 0) {
    throw new Error(diff.stderr.trim() || 'Cannot inspect staged changes.');
  }

  stage = 'complete_todo';
  writePlan(root, planPath!, completedPlan);
  completed.todo_number = todoNumber;

  if (completed.commit) {
    stage = 'push_todo';
    git('push');
  }

  stage = 'next_todo';
  if (git('status', '--porcelain')) {
    throw new Error('Worktree or index is not clean.');
  }
  const next = selectNextTodo(completedPlan);
  if (next.content !== completedPlan) {
    writePlan(root, planPath!, next.content);
  }
  process.stdout.write(`${JSON.stringify({ ...next.selection, ...completed })}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({
    status: 'failed', stage,
    reason: error instanceof Error ? error.message : String(error),
    ...completed,
  })}\n`);
  process.exitCode = 1;
}
