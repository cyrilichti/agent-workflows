import { readFileSync } from 'node:fs';
import { readWorkRequest as readGitHubRequest } from '../providers/github/read-work-request.ts';
import { readWorkRequest as readGitLabRequest } from '../providers/gitlab/read-work-request.ts';
import * as github from '../providers/github/update-request.ts';
import * as gitlab from '../providers/gitlab/update-request.ts';
import type { GitHubRepository, GitLabRepository } from './resolve-version-repository.ts';

type Input = {
  request: {
    request_id: number; kind: 'pull_request' | 'merge_request'; url: string;
  };
  action: 'replace-description' | 'mark-ready';
  body?: string;
};

function repository(input: Input): GitHubRepository | GitLabRepository {
  const url = new URL(input.request.url);
  const path = url.pathname.split('/').filter(Boolean);
  if (input.request.kind === 'pull_request') {
    if (path.length !== 4 || path[2] !== 'pull' || Number(path[3]) !== input.request.request_id) {
      throw new Error('Invalid pull request identity.');
    }
    return { host: url.host, owner: path[0]!, repo: path[1]! };
  }
  const marker = '/-/merge_requests/';
  const index = url.pathname.indexOf(marker);
  if (index < 0 || Number(url.pathname.slice(index + marker.length)) !== input.request.request_id) {
    throw new Error('Invalid merge request identity.');
  }
  return { host: url.host, path: decodeURIComponent(url.pathname.slice(1, index)),
    url: input.request.url.slice(0, input.request.url.indexOf(marker)) };
}

function equalBody(left: string, right: string): boolean {
  return left.replace(/[\r\n]+$/, '') === right.replace(/[\r\n]+$/, '');
}

export function updateRequest(input: Input) {
  if (!input || !input.request || !Number.isInteger(input.request.request_id) ||
    (input.action !== 'replace-description' && input.action !== 'mark-ready') ||
    (input.action === 'replace-description' && typeof input.body !== 'string') ||
    (input.action === 'mark-ready' && input.body !== undefined)) {
    throw new Error('Invalid request update input.');
  }
  const repo = repository(input);
  const read = () => input.request.kind === 'pull_request'
    ? readGitHubRequest(repo as GitHubRepository, input.request.request_id)
    : readGitLabRequest(repo as GitLabRepository, input.request.request_id);
  let current = read();
  if (current.state !== 'open') throw new Error('Request is not open.');
  if (input.action === 'replace-description') {
    if (!equalBody(current.body, input.body!)) {
      if (input.request.kind === 'pull_request') {
        github.replaceDescription(repo as GitHubRepository, input.request.request_id, input.body!);
      } else {
        gitlab.replaceDescription(repo as GitLabRepository, input.request.request_id, input.body!);
      }
      current = read();
    }
    if (!equalBody(current.body, input.body!)) {
      throw new Error('Request description postcondition was not observed.');
    }
  } else {
    const title = current.title.replace(/^Draft:\s*/, '');
    if (current.draft || title !== current.title) {
      if (input.request.kind === 'pull_request') {
        github.markReady(repo as GitHubRepository, input.request.request_id,
          title === current.title ? undefined : title, current.draft);
      } else {
        gitlab.markReady(repo as GitLabRepository, input.request.request_id,
          title === current.title ? undefined : title);
      }
      current = read();
    }
    if (current.draft || current.title !== title) {
      throw new Error('Ready request postcondition was not observed.');
    }
  }
  return { status: 'succeeded' as const, request: current };
}

if (import.meta.main) {
  try {
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    process.stdout.write(`${JSON.stringify(updateRequest(input))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed',
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
