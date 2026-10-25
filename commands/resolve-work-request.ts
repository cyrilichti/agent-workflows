import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { readWorkRequest as readGitHubRequest } from '../providers/github/read-work-request.ts';
import { readWorkRequest as readGitLabRequest } from '../providers/gitlab/read-work-request.ts';
import { resolveConfiguredProvider } from './resolve-item-provider.ts';
import { resolveVersionRepository } from './resolve-version-repository.ts';
import type { GitHubRepository, GitLabRepository } from './resolve-version-repository.ts';

function githubBacklinkId(value: string, repository: GitHubRepository): number | undefined {
  const url = new URL(value);
  const path = url.pathname.split('/').filter(Boolean);
  if (url.host === repository.host && path.length === 4 &&
      path[0] === repository.owner && path[1] === repository.repo && path[2] === 'pull' &&
      /^\d+$/.test(path[3]!)) {
    return Number(path[3]);
  }
  return undefined;
}

function gitlabBacklinkId(value: string, repository: GitLabRepository): number | undefined {
  const url = new URL(value);
  const path = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const segments = repository.path.split('/');
  if (url.host === repository.host && path.length === segments.length + 3 &&
      segments.every((part, index) => path[index] === part) &&
      path[segments.length] === '-' && path[segments.length + 1] === 'merge_requests' &&
      /^\d+$/.test(path[segments.length + 2]!)) {
    return Number(path[segments.length + 2]);
  }
  return undefined;
}

export function resolveWorkRequest(
  provider: 'github' | 'gitlab',
  repository: GitHubRepository | GitLabRepository,
  requestId: number | undefined,
  backlinks: string[],
  expectedBranch: string | undefined,
) {
  const ids = new Set<number>();
  if (requestId !== undefined) {
    ids.add(requestId);
  } else {
    for (const backlink of backlinks) {
      try {
        const id = provider === 'github'
          ? githubBacklinkId(backlink, repository as GitHubRepository)
          : gitlabBacklinkId(backlink, repository as GitLabRepository);
        if (id !== undefined) {
          ids.add(id);
        }
      } catch {
        // Ignore backlinks that are not request URLs.
      }
    }
  }
  if (ids.size !== 1) {
    throw new Error('Supply the exact pull request number or merge request IID.');
  }
  const id = [...ids][0]!;
  const request = provider === 'github'
    ? readGitHubRequest(repository as GitHubRepository, id)
    : readGitLabRequest(repository as GitLabRepository, id);
  if (request.state !== 'open') {
    throw new Error(`Request ${id} is ${request.state}.`);
  }
  if (expectedBranch && request.source_branch !== expectedBranch) {
    throw new Error(`Request ${id} uses ${request.source_branch}, expected ${expectedBranch}.`);
  }
  return request;
}

function git(root: string, ...args: string[]): string {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim());
  }
  return result.stdout.trim();
}

function gitConfig(root: string, key: string): string | undefined {
  const result = spawnSync('git', ['config', '--get', key], { cwd: root, encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  return result.status === 0 ? result.stdout.trim() || undefined : undefined;
}

function pushRemote(root: string): string {
  const current = git(root, 'branch', '--show-current');
  const configured = gitConfig(root, `branch.${current}.pushRemote`) ||
    gitConfig(root, 'remote.pushDefault') || gitConfig(root, `branch.${current}.remote`);
  if (configured) {
    return configured;
  }
  const remotes = git(root, 'remote').split('\n').filter(Boolean);
  if (remotes.length !== 1) {
    throw new Error('Cannot identify the current push remote.');
  }
  return remotes[0]!;
}

export function resolveWorkRequestForProject(
  root: string,
  requestId: number | undefined,
  backlinks: string[],
  expectedBranch: string | undefined,
) {
  const provider = resolveConfiguredProvider(join(root, 'agent-workflows.yaml'), 'version') as
    'github' | 'gitlab';
  const remoteUrl = git(root, 'remote', 'get-url', '--push', pushRemote(root));
  const repository = resolveVersionRepository(remoteUrl, provider);
  return resolveWorkRequest(provider, repository, requestId, backlinks, expectedBranch);
}

if (import.meta.main) {
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    const input = JSON.parse(readFileSync(0, 'utf8')) as { request_backlinks: string[] };
    const request = resolveWorkRequestForProject(root, undefined, input.request_backlinks, undefined);
    process.stdout.write(`${JSON.stringify({
      status: 'resolved', request, branch: request.source_branch,
    })}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({
      status: 'failed', stage: 'resolve_request',
      reason: error instanceof Error ? error.message : String(error),
    })}\n`);
    process.exitCode = 1;
  }
}
