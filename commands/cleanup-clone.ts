import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CleanupDelivery } from './cleanup-delivery.ts';
import { discoverLocalRepositories } from './resolve-local-project-directory.ts';

export type CleanupClone = { path: string; commonDirectory: string; remote: string; pushUrl: string };

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

function matchesRemote(value: string, delivery: CleanupDelivery): boolean {
  const scp = /^(?:[^@/:]+@)?([^:/]+):([^/].*)$/.exec(value);
  const url = scp ? new URL(`ssh://${scp[1]}/${scp[2]}`) : URL.canParse(value) ? new URL(value) : null;
  if (!url || !['https:', 'ssh:'].includes(url.protocol) || url.search || url.hash) return false;
  const host = url.protocol === 'ssh:' ? url.hostname : url.host;
  const repository = url.pathname.replace(/^\//, '').replace(/\/$/, '').replace(/\.git$/, '');
  const expected = delivery.repository;
  return host.toLowerCase() === delivery.host.toLowerCase() &&
    (delivery.provider === 'github' ? repository.toLowerCase() === expected.toLowerCase() : repository === expected);
}

export function findCleanupClone(
  delivery: CleanupDelivery, paths = discoverLocalRepositories(),
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
        clones.set(commonDirectory, { path, commonDirectory, remote, pushUrl: pushUrls[0]! });
      }
    }
  }
  if (clones.size !== 1) {
    throw new Error(clones.size ? 'Multiple local clones match the delivery repository.' :
      'No local clone matches the delivery repository.');
  }
  return [...clones.values()][0]!;
}
