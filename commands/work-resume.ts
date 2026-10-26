import { spawnSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { resolveWorkRequestForProject } from './resolve-work-request.ts';

const parent = dirname(import.meta.dirname);
const root = basename(parent) === '.agents' ? dirname(parent) : parent;
let stage = 'resolve_request';
const completed: Record<string, unknown> = {};

function run(program: string, args: string[]): string {
  const result = spawnSync(program, args, { cwd: root, encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() ||
      `${program} exited with status ${result.status}.`);
  }
  return result.stdout.trim();
}

function git(...args: string[]): string {
  return run('git', args);
}

try {
  const [itemId, requestId, branch] = process.argv.slice(2);
  const request = resolveWorkRequestForProject(root,
    Number(requestId), [], branch);
  completed.request = request;
  completed.branch = request.source_branch;

  stage = 'switch_branch';
  git('switch', '--no-guess', request.source_branch);

  stage = 'check_worktree';
  if (git('status', '--porcelain')) {
    throw new Error('Worktree or index is not clean.');
  }

  stage = 'start_item';
  const result = spawnSync(process.execPath, [
    join(import.meta.dirname, 'transition-item-status.ts'),
  ], {
    cwd: root,
    encoding: 'utf8',
    input: JSON.stringify({ item_id: itemId }),
  });
  if (result.error) {
    throw result.error;
  }
  const transition = JSON.parse(result.stdout) as {
    status: string;
    reason?: string;
    resulting_status: unknown;
  };
  if (result.status !== 0 || transition.status === 'failed') {
    throw new Error(transition.reason || result.stderr.trim());
  }
  completed.resulting_status = transition.resulting_status;
  process.stdout.write(`${JSON.stringify({ status: 'resumed', ...completed })}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({
    status: 'failed',
    stage,
    reason: error instanceof Error ? error.message : String(error),
    ...completed,
  })}\n`);
  process.exitCode = 1;
}
