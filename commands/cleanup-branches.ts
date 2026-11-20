import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { runGit } from './cleanup-clone.ts';
import type { CleanupClone } from './cleanup-clone.ts';
import { confirmBranchEligible } from './cleanup-delivery.ts';
import type { CleanupDelivery } from './cleanup-delivery.ts';
import { withRepositoryLock } from './cleanup-repository-lock.ts';

type RefOutcome = 'absent' | 'removed' | 'blocked' | 'not attempted';
export type CleanupOutcome = { local: RefOutcome; remote: RefOutcome; reason?: string };

function checkedOut(path: string, ref: string): string[] {
  const fields = runGit(path, ['worktree', 'list', '--porcelain', '-z'])!.split('\0');
  const worktrees: string[] = [];
  let current = '';
  for (const field of fields) {
    if (field.startsWith('worktree ')) current = field.slice(9);
    if (field === `branch ${ref}`) worktrees.push(current);
  }
  return worktrees;
}

function checkoutDefault(clone: CleanupClone, branch: string): void {
  const path = clone.path;
  if (runGit(path, ['status', '--porcelain', '--untracked-files=normal'])) {
    throw new Error('The checkout contains uncommitted changes.');
  }
  for (const operation of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-apply', 'rebase-merge', 'BISECT_START']) {
    const location = runGit(path, ['rev-parse', '--git-path', operation])!;
    if (existsSync(resolve(path, location))) throw new Error('The checkout has an in-progress Git operation.');
  }
  const ref = `refs/heads/${branch}`;
  if (runGit(path, ['show-ref', '--exists', ref], 2) === undefined) {
    runGit(path, ['fetch', '--no-tags', '--', clone.remote, ref]);
    runGit(path, ['switch', '--no-guess', '--no-overwrite-ignore', '-c', branch, 'FETCH_HEAD']);
  } else {
    runGit(path, ['switch', '--no-guess', '--no-overwrite-ignore', '--', branch]);
  }
  runGit(path, ['pull', '--ff-only', '--', clone.remote, ref]);
}

function remoteHead(clone: CleanupClone, ref: string): string | undefined {
  const output = runGit(clone.path, ['ls-remote', '--exit-code', '--refs', '--', clone.pushUrl, ref], 2);
  if (output === undefined) return undefined;
  const [sha, name] = output.split('\t');
  if (!sha || name !== ref) throw new Error('Cannot verify the remote ref.');
  return sha;
}

export function cleanupBranches(
  clone: CleanupClone, delivery: CleanupDelivery, verify = confirmBranchEligible,
): CleanupOutcome {
  const outcome: CleanupOutcome = { local: 'not attempted', remote: 'not attempted' };
  const { path } = clone;
  const ref = `refs/heads/${delivery.branch}`;
  try {
    return withRepositoryLock(clone.commonDirectory, () => {
      runGit(path, ['check-ref-format', ref]);
      runGit(path, ['check-ref-format', '--branch', delivery.defaultBranch]);
      const endpoint = runGit(path, ['remote', 'get-url', '--push', '--all', clone.remote]);
      if (endpoint !== clone.pushUrl) throw new Error('The matching push destination changed.');
      outcome.local = 'blocked';
      const local = runGit(path, ['show-ref', '--exists', ref], 2) === undefined
        ? undefined : runGit(path, ['show-ref', '--hash', '--verify', ref]);
      const remote = remoteHead(clone, ref);
      if (local !== undefined && local !== delivery.sha) throw new Error('The local ref differs from the delivered commit.');
      if (remote !== undefined && remote !== delivery.sha) throw new Error('The remote ref differs from the delivered commit.');
      verify(delivery, remote !== undefined);
      if (local === undefined) {
        outcome.local = 'absent';
      } else {
        const worktrees = checkedOut(path, ref);
        if (worktrees.length && (worktrees.length !== 1 || realpathSync(worktrees[0]!) !== realpathSync(path))) {
          throw new Error('The branch is checked out in another worktree.');
        }
        if (worktrees.length) checkoutDefault(clone, delivery.defaultBranch);
        if (checkedOut(path, ref).length) throw new Error('The branch is still checked out.');
        runGit(path, ['update-ref', '--no-deref', '-d', ref, delivery.sha]);
        if (runGit(path, ['show-ref', '--exists', ref], 2) !== undefined) {
          throw new Error('The local ref is still present.');
        }
        outcome.local = 'removed';
      }
      outcome.remote = 'blocked';
      if (remote === undefined) {
        outcome.remote = 'absent';
      } else {
        verify(delivery, true);
        runGit(path, ['push', `--force-with-lease=${ref}:${delivery.sha}`, '--', clone.remote, `:${ref}`]);
        if (remoteHead(clone, ref) !== undefined) throw new Error('The remote ref is still present.');
        outcome.remote = 'removed';
      }
      return outcome;
    });
  } catch (error) {
    return { ...outcome, reason: error instanceof Error ? error.message : String(error) };
  }
}
