import { execFileSync } from 'node:child_process';
import type { GitLabRepository } from '../../commands/resolve-version-repository.ts';
import type { ReadFields } from '../github/read-request.ts';

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
  detailed_merge_status?: string;
};

type Version = {
  head_commit_sha: string;
  base_commit_sha: string;
  start_commit_sha: string;
};

function api(repository: GitLabRepository, path: string, paginated = false): unknown {
  const args = ['api', '--hostname', repository.host];
  if (paginated) args.push('--paginate');
  args.push(path);
  return JSON.parse(execFileSync('glab', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }));
}

function pages(repository: GitLabRepository, path: string): unknown[] {
  const result = api(repository, path, true);
  if (!Array.isArray(result)) throw new Error(`Incomplete GitLab data at ${path}.`);
  return result;
}

export function readRequest(repository: GitLabRepository, requestId: number, fields?: ReadFields) {
  const path = `projects/${encodeURIComponent(repository.path)}/merge_requests/${requestId}`;
  const request = api(repository, path) as MergeRequest;
  if (request.iid !== requestId || !request.sha) {
    throw new Error('GitLab merge request identity or head SHA is invalid.');
  }
  const result = {
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
  if (!fields) return result;
  if (fields === 'delivery_state') {
    return { ...result, delivery_state: {
      head_sha: request.sha, state: result.state, draft: result.draft,
      merge_status: request.state === 'merged' ? 'merged' :
        request.detailed_merge_status === 'mergeable' ? 'mergeable' : 'unknown',
      blocker: request.detailed_merge_status,
    } };
  }
  const versions = pages(repository, `${path}/versions`) as Version[];
  const latest = versions[0];
  if (!latest || latest.head_commit_sha !== request.sha || !latest.base_commit_sha ||
      !latest.start_commit_sha) {
    throw new Error('GitLab merge request diff version is unavailable or stale.');
  }
  const discussions = pages(repository, `${path}/discussions`);
  const approvals = api(repository, `${path}/approvals`);
  const reviewers = api(repository, `${path}/reviewers`);
  const current = api(repository, path) as MergeRequest;
  if (current.sha !== request.sha) {
    throw new Error('GitLab merge request changed during snapshot collection.');
  }
  return { ...result,
    comparison: { base_sha: latest.base_commit_sha, start_sha: latest.start_commit_sha,
      head_sha: latest.head_commit_sha },
    review_activity: { discussions, approvals, reviewers },
  };
}
