import { execFileSync } from 'node:child_process';
import type { GitHubRepository } from '../../commands/resolve-version-repository.ts';

type Pull = {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  draft: boolean;
  head: { ref: string; sha: string };
  base: { ref: string };
  body: string | null;
  html_url: string;
};

export function readRequest(repository: GitHubRepository, requestId: number) {
  const output = execFileSync('gh', [
    'api', '--hostname', repository.host,
    `repos/${repository.owner}/${repository.repo}/pulls/${requestId}`,
  ], { encoding: 'utf8' });
  const pull = JSON.parse(output) as Pull;
  return {
    request_id: pull.number,
    kind: 'pull_request' as const,
    title: pull.title,
    state: pull.merged ? 'merged' : pull.state,
    draft: pull.draft,
    source_branch: pull.head.ref,
    head_sha: pull.head.sha,
    target_branch: pull.base.ref,
    body: pull.body ?? '',
    url: pull.html_url,
  };
}
