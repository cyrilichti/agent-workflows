import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { CleanupDelivery, CleanupRepository } from './cleanup-remote.ts';

export type CleanupClone = { path: string; remote: string; pushUrl: string };

export function runGit(path: string, args: string[], missingStatus?: number): string | undefined {
  const result = spawnSync('git', args, {
    cwd: path, encoding: 'utf8', timeout: 25_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (result.status === missingStatus) return undefined;
    throw new Error(result.stderr.trim() || `Git ${args[0]} failed.`);
  }
  return result.stdout.trimEnd();
}

function matchesRemote(value: string, delivery: CleanupRepository): boolean {
  const scp = /^(?:[^@/:]+@)?([^:/]+):([^/].*)$/.exec(value);
  const url = scp ? new URL(`ssh://${scp[1]}/${scp[2]}`) : URL.canParse(value) ? new URL(value) : null;
  if (!url || !['https:', 'ssh:'].includes(url.protocol) || url.search || url.hash) return false;
  const host = url.protocol === 'ssh:' ? url.hostname : url.host;
  const repository = url.pathname.replace(/^\//, '').replace(/\/$/, '').replace(/\.git$/, '');
  const expected = delivery.repository;
  return host.toLowerCase() === delivery.host.toLowerCase() &&
    (delivery.provider === 'github' ? repository.toLowerCase() === expected.toLowerCase() : repository === expected);
}

export function discoverLocalRepositories(paths?: string[]): string[] {
  const args = [join(import.meta.dirname, 'resolve-local-project-directory.ts'), '--list-clones'];
  if (paths) args.push(JSON.stringify(paths));
  return JSON.parse(execFileSync(process.execPath, args, { encoding: 'utf8', timeout: 25_000 })) as string[];
}

export function findCleanupClone(
  delivery: CleanupRepository, paths = discoverLocalRepositories(),
): CleanupClone {
  const clones = new Map<string, CleanupClone>();
  for (const path of paths) {
    const remotes = runGit(path, ['remote'])!.split('\n').filter(Boolean);
    for (const remote of remotes) {
      const fetchUrl = runGit(path, ['remote', 'get-url', remote])!;
      const pushUrls = runGit(path, ['remote', 'get-url', '--push', '--all', remote])!.split('\n');
      if (![fetchUrl, ...pushUrls].some(url => matchesRemote(url, delivery))) continue;
      if (!matchesRemote(fetchUrl, delivery) || pushUrls.length !== 1 || !matchesRemote(pushUrls[0]!, delivery)) {
        throw new Error(`Cannot verify a single matching fetch and push destination in ${path}.`);
      }
      const commonDirectory = realpathSync(resolve(path, runGit(path, ['rev-parse', '--git-common-dir'])!));
      const found = clones.get(commonDirectory);
      if (found && found.remote !== remote) {
        throw new Error(`Multiple remotes match the delivery in ${path}.`);
      }
      if (!found || resolve(path, '.git') === commonDirectory) {
        clones.set(commonDirectory, { path, remote, pushUrl: pushUrls[0]! });
      }
    }
  }
  if (clones.size !== 1) {
    throw new Error(clones.size ? 'Multiple local clones match the delivery repository.' :
      'No local clone matches the delivery repository.');
  }
  return [...clones.values()][0]!;
}

type RefOutcome = 'absent' | 'removed' | 'blocked' | 'not attempted';
export type CleanupOutcome = { local: RefOutcome; remote: RefOutcome; reason?: string };

const detachedOperations = ['rebase-apply', 'rebase-merge', 'BISECT_START'];

function hasGitOperation(path: string, markers: string[]): boolean {
  const gitDirectory = runGit(path, ['rev-parse', '--absolute-git-dir'])!;
  return markers.some(marker => existsSync(join(gitDirectory, marker)));
}

function checkedOut(path: string, ref: string): string[] {
  const fields = runGit(path, ['worktree', 'list', '--porcelain', '-z'])!.split('\0');
  const worktrees: string[] = [];
  let current = '';
  for (const field of fields) {
    if (field.startsWith('worktree ')) current = field.slice(9);
    if (field === `branch ${ref}`) worktrees.push(current);
    if (field === 'detached' && existsSync(current) && hasGitOperation(current, detachedOperations)) {
      throw new Error(`A detached worktree has an in-progress rebase or bisect: ${current}`);
    }
  }
  return worktrees;
}

function localHead(path: string, ref: string): string | undefined {
  const refs = runGit(path, ['for-each-ref', '--format=%(refname)%09%(objectname)', ref])!;
  return refs.split('\n').find(line => line.startsWith(`${ref}\t`))?.split('\t')[1];
}

function checkoutDefault(clone: CleanupClone, branch: string, previous: string): void {
  const path = clone.path;
  if (runGit(path, ['status', '--porcelain', '--untracked-files=normal'])) {
    throw new Error('The checkout contains uncommitted changes.');
  }
  if (hasGitOperation(path, [...detachedOperations, 'MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD'])) {
    throw new Error('The checkout has an in-progress Git operation.');
  }
  const ref = `refs/heads/${branch}`;
  if (localHead(path, ref) === undefined) {
    runGit(path, ['fetch', '--no-tags', '--', clone.remote, ref]);
    runGit(path, ['switch', '--no-guess', '--no-overwrite-ignore', '-c', branch, 'FETCH_HEAD']);
  } else {
    runGit(path, ['switch', '--no-guess', '--no-overwrite-ignore', '--', branch]);
  }
  try {
    runGit(path, ['pull', '--ff-only', '--', clone.remote, ref]);
  } catch (error) {
    try {
      runGit(path, ['switch', '--no-guess', '--no-overwrite-ignore', '--', previous]);
    } catch (restore) {
      throw new Error(`${String(error)} Could not restore the delivery checkout: ${String(restore)}`);
    }
    throw error;
  }
}

export function cleanupBranches(clone: CleanupClone, delivery: CleanupDelivery): CleanupOutcome {
  const outcome: CleanupOutcome = { local: 'not attempted', remote: 'not attempted' };
  const { path } = clone;
  const ref = `refs/heads/${delivery.branch}`;
  try {
    runGit(path, ['check-ref-format', ref]);
    runGit(path, ['check-ref-format', '--branch', delivery.defaultBranch]);
    const endpoint = runGit(path, ['remote', 'get-url', '--push', '--all', clone.remote]);
    if (endpoint !== clone.pushUrl) throw new Error('The matching push destination changed.');
    outcome.local = 'blocked';
    const local = localHead(path, ref);
    if (local !== undefined && local !== delivery.sha) throw new Error('The local ref differs from the delivered commit.');
    if (local === undefined) {
      outcome.local = 'absent';
    } else {
      const worktrees = checkedOut(path, ref);
      if (worktrees.length && (worktrees.length !== 1 || realpathSync(worktrees[0]!) !== realpathSync(path))) {
        throw new Error('The branch is checked out in another worktree.');
      }
      if (worktrees.length) checkoutDefault(clone, delivery.defaultBranch, delivery.branch);
      if (checkedOut(path, ref).length) throw new Error('The branch is still checked out.');
      runGit(path, ['update-ref', '--no-deref', '-d', ref, delivery.sha]);
      outcome.local = 'removed';
    }
    outcome.remote = 'blocked';
    const remote = runGit(path, ['ls-remote', '--exit-code', '--refs', '--', clone.pushUrl, ref], 2);
    if (remote === undefined) {
      outcome.remote = 'absent';
    } else {
      runGit(path, ['push', `--force-with-lease=${ref}:${delivery.sha}`, '--', clone.remote, `:${ref}`]);
      outcome.remote = 'removed';
    }
    return outcome;
  } catch (error) {
    return { ...outcome, reason: error instanceof Error ? error.message : String(error) };
  }
}
