import { randomUUID } from 'node:crypto';
import { readlinkSync, symlinkSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runGit } from './cleanup-clone.ts';

export function acquireRepository(path: string, owner: string): void {
  const lock = join(path, 'agent-workflows-repository.lock');
  try {
    symlinkSync(owner, lock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    throw new Error(`Repository is busy. Lock: ${lock}`);
  }
}

export function releaseRepository(path: string, owner: string): void {
  const lock = join(path, 'agent-workflows-repository.lock');
  if (readlinkSync(lock) !== owner) throw new Error('Repository lock belongs to another execution.');
  unlinkSync(lock);
}

export function withRepositoryLock<T>(path: string, operation: () => T): T {
  const owner = randomUUID();
  acquireRepository(path, owner);
  try {
    return operation();
  } finally {
    releaseRepository(path, owner);
  }
}

if (import.meta.main) {
  const [action, path, owner] = process.argv.slice(2);
  if (!path || !owner || !['acquire', 'release'].includes(action ?? '')) {
    throw new Error('Supply acquire or release, a checkout path, and an execution owner.');
  }
  const commonDirectory = resolve(path, runGit(path, ['rev-parse', '--git-common-dir'])!);
  if (action === 'acquire') acquireRepository(commonDirectory, owner);
  else releaseRepository(commonDirectory, owner);
  process.stdout.write(JSON.stringify({ owner }));
}
