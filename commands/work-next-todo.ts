import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { appendCorrectiveTodos, readPlan, selectNextTodo, writePlan } from './work-todo-plan.ts';
import type { SourceFinding } from './work-todo-plan.ts';

const parent = dirname(import.meta.dirname);
const root = basename(parent) === '.agents' ? dirname(parent) : parent;

try {
  const planPath = process.argv[2]!;
  const findings = JSON.parse(readFileSync(0, 'utf8')) as SourceFinding[];
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  if (status.error) {
    throw status.error;
  }
  if (status.status !== 0 || status.stdout.trim()) {
    throw new Error('Worktree or index is not clean.');
  }

  const current = readPlan(root, planPath);
  const withFindings = appendCorrectiveTodos(current, findings);
  if (withFindings !== current) {
    writePlan(root, planPath, withFindings);
  }
  const next = selectNextTodo(withFindings);
  if (next.content !== withFindings) {
    writePlan(root, planPath, next.content);
  }
  process.stdout.write(`${JSON.stringify(next.selection)}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({
    status: 'failed',
    stage: 'next_todo',
    reason: error instanceof Error ? error.message : String(error),
  })}\n`);
  process.exitCode = 1;
}
