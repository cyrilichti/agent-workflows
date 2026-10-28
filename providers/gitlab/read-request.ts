import { execFileSync } from 'node:child_process';
import type { GitLabRepository } from '../../commands/resolve-version-repository.ts';

type MergeRequest = {
  iid: number;
  title: string;
  state: string;
  draft?: boolean;
  work_in_progress?: boolean;
  source_branch: string;
  sha: string;
  target_branch: string;
  description?: string;
  web_url: string;
};

export function readRequest(repository: GitLabRepository, requestId: number) {
  const output = execFileSync('glab', [
    'api', '--hostname', repository.host,
    `projects/${encodeURIComponent(repository.path)}/merge_requests/${requestId}`,
  ], { encoding: 'utf8' });
  const request = JSON.parse(output) as MergeRequest;
  return {
    request_id: request.iid,
    kind: 'merge_request' as const,
    title: request.title,
    state: request.state === 'opened' ? 'open' : request.state,
    draft: request.draft === true || request.work_in_progress === true,
    source_branch: request.source_branch,
    head_sha: request.sha,
    target_branch: request.target_branch,
    body: request.description ?? '',
    url: request.web_url,
  };
}
