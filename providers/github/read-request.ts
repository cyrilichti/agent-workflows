import { execFileSync } from 'node:child_process';
import type { GitHubRepository } from '../../commands/resolve-version-repository.ts';

type Pull = {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  draft: boolean;
  head: { ref: string; sha: string };
  base: { ref: string; sha?: string };
  body: string | null;
  html_url: string;
  mergeable?: boolean | null;
  mergeable_state?: string;
};

export type ReadFields = 'review_snapshot' | 'delivery_state';

function api(repository: GitHubRepository, path: string, paginated = false): unknown {
  const args = ['api', '--hostname', repository.host];
  if (paginated) args.push('--paginate', '--slurp');
  args.push(path);
  return JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }));
}

function pages(repository: GitHubRepository, path: string): unknown[] {
  const result = api(repository, path, true);
  if (!Array.isArray(result) || !result.every(Array.isArray)) {
    throw new Error(`Incomplete GitHub review activity at ${path}.`);
  }
  return result.flat();
}

export function readRequest(repository: GitHubRepository, requestId: number, fields?: ReadFields) {
  const prefix = `repos/${repository.owner}/${repository.repo}`;
  const path = `${prefix}/pulls/${requestId}`;
  const pull = api(repository, path) as Pull;
  if (pull.number !== requestId || !pull.head?.sha) {
    throw new Error('GitHub pull request identity or head SHA is invalid.');
  }
  const request = {
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
  if (!fields) return request;
  if (fields === 'delivery_state') {
    return { ...request, delivery_state: {
      head_sha: pull.head.sha, state: request.state, draft: request.draft,
      merge_status: pull.merged ? 'merged' : pull.mergeable === false ? 'blocked' :
        pull.mergeable === true ? 'mergeable' : 'unknown',
      blocker: pull.mergeable_state,
    } };
  }
  if (!pull.base.sha) throw new Error('GitHub pull request base SHA is unavailable.');
  const comments = pages(repository, `${path}/comments?per_page=100`);
  const reviews = pages(repository, `${path}/reviews?per_page=100`);
  const issue_comments = pages(repository, `${prefix}/issues/${requestId}/comments?per_page=100`);
  const current = api(repository, path) as Pull;
  if (current.head?.sha !== pull.head.sha || current.base?.sha !== pull.base.sha) {
    throw new Error('GitHub pull request changed during snapshot collection.');
  }
  return { ...request,
    comparison: { base_sha: pull.base.sha, head_sha: pull.head.sha },
    review_activity: { comments, reviews, issue_comments },
  };
}
