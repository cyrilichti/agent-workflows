import { spawnSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { requestPushRemoteForProject, resolveRequestForProject } from './resolve-request.ts';

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

export function resumeBranch(branch: string, headSha: string,
  remote: () => string, runGit: (...args: string[]) => string = git): void {
  let local = false;
  try {
    runGit('show-ref', '--verify', '--quiet', `refs/heads/${branch}`);
    local = true;
  } catch {
    // Recover the request branch from its own remote when it is not local.
  }
  if (local) {
    runGit('switch', '--no-guess', branch);
    return;
  }
  const name = remote();
  const url = runGit('remote', 'get-url', '--push', name);
  const tracking = `refs/remotes/${name}/${branch}`;
  let fetched = false;
  try {
    runGit('fetch', '--no-tags', url, `refs/heads/${branch}:${tracking}`);
    fetched = true;
  } catch (error) {
    if (!/^[0-9a-f]{40,64}$/i.test(headSha)) throw error;
    try {
      try {
        runGit('cat-file', '-e', `${headSha}^{commit}`);
      } catch {
        runGit('fetch', '--no-tags', url, headSha);
        runGit('cat-file', '-e', `${headSha}^{commit}`);
      }
    } catch (recovery) {
      throw new Error(`Cannot recover request branch ${branch} at ${headSha}: ${
        recovery instanceof Error ? recovery.message : String(recovery)}`);
    }
  }
  runGit('switch', '-c', branch, ...(fetched ? ['--track', tracking] : [headSha]));
  if (!fetched) {
    runGit('config', `branch.${branch}.remote`, name);
    runGit('config', `branch.${branch}.merge`, `refs/heads/${branch}`);
  }
}

if (import.meta.main) {
  try {
    const [itemId, requestId, branch] = process.argv.slice(2);
    const request = resolveRequestForProject(root,
      Number(requestId), [], branch);
    completed.request = request;
    completed.branch = request.source_branch;

    stage = 'switch_branch';
    resumeBranch(request.source_branch, request.head_sha,
      () => requestPushRemoteForProject(root));

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
}
