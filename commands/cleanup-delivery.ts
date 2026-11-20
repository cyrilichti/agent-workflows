import { execFileSync } from 'node:child_process';
import { readItem } from './read-item.ts';
import type { ItemProvider } from './read-item.ts';

export type CleanupRepository = {
  provider: 'github' | 'gitlab';
  host: string;
  repository: string;
};

export type CleanupDelivery = CleanupRepository & {
  request: string;
  branch: string;
  target: string;
  defaultBranch: string;
  sha: string;
};

function api<T>(cli: 'gh' | 'glab', host: string, endpoint: string): T {
  return JSON.parse(execFileSync(cli, ['api', '--hostname', host, endpoint], {
    encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'],
  })) as T;
}

function githubDelivery(url: URL, repository: string, number: string): CleanupDelivery & { body: string } {
  const pull = api<{
    number: number; merged: boolean; body: string | null;
    head: { sha: string; ref: string; repo?: { id: number; full_name: string } };
    base: { ref: string; repo: { id: number; full_name: string; default_branch: string } };
  }>('gh', url.host, `repos/${repository}/pulls/${number}`);
  if (pull.number !== Number(number) || !pull.merged || !pull.head.repo ||
      pull.head.repo.id !== pull.base.repo.id ||
      pull.head.repo.full_name.toLowerCase() !== repository.toLowerCase()) {
    throw new Error('Expected a merged pull request from the same repository.');
  }
  return { provider: 'github', host: url.host, repository: pull.head.repo.full_name,
    request: url.href, branch: pull.head.ref, target: pull.base.ref,
    defaultBranch: pull.base.repo.default_branch, sha: pull.head.sha, body: pull.body ?? '' };
}

function gitlabDelivery(url: URL, repository: string, number: string): CleanupDelivery & { body: string } {
  const projectPath = encodeURIComponent(repository);
  const merge = api<{
    iid: number; state: string; description?: string; source_project_id: number | null;
    target_project_id: number; source_branch: string; target_branch: string; sha: string;
  }>('glab', url.host, `projects/${projectPath}/merge_requests/${number}`);
  if (merge.iid !== Number(number) || merge.state !== 'merged' || !merge.source_project_id ||
      merge.source_project_id !== merge.target_project_id) {
    throw new Error('Expected a merged merge request from the same repository.');
  }
  const project = api<{ id: number; path_with_namespace: string; default_branch: string }>(
    'glab', url.host, `projects/${merge.source_project_id}`);
  if (project.id !== merge.source_project_id || project.path_with_namespace !== repository) {
    throw new Error('Cannot verify the merge request source repository.');
  }
  return { provider: 'gitlab', host: url.host, repository, request: url.href,
    branch: merge.source_branch, target: merge.target_branch, defaultBranch: project.default_branch,
    sha: merge.sha, body: merge.description ?? '' };
}

export function readCleanupDelivery<T>(provider: ItemProvider, id: string,
  identifyClone: (repository: CleanupRepository) => T,
): { delivery: CleanupDelivery; clone: T } {
  const ticket = readItem(provider, id);
  const status = ticket.status as { type?: string } | null;
  if (status?.type !== (provider === 'linear' ? 'completed' : 'done') ||
      !ticket.labels.includes('agent-inspected')) {
    throw new Error('The ticket is no longer a completed workflow delivery.');
  }
  if (ticket.request_backlinks.length !== 1) throw new Error('Expected one delivery backlink.');
  const url = new URL(ticket.request_backlinks[0]!);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('Invalid delivery backlink.');
  }
  const github = /^\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)\/?$/.exec(url.pathname);
  const gitlab = /^\/([\w.-]+(?:\/[\w.-]+)+)\/-\/merge_requests\/(\d+)\/?$/.exec(url.pathname);
  const match = github ?? gitlab;
  if (!match) throw new Error('Unsupported delivery backlink.');
  const clone = identifyClone({ provider: github ? 'github' : 'gitlab',
    host: url.host, repository: match[1]! });
  const delivery = github ? githubDelivery(url, match[1]!, match[2]!) :
    gitlabDelivery(url, match[1]!, match[2]!);
  const { body, ...result } = delivery;
  const ticketLink = `**Ticket :** [${ticket.identifier ?? ticket.id}](${ticket.url})`;
  if (!body.split(/\r?\n/).some(line => line.trim() === ticketLink) ||
      !/^[0-9a-f]{40,64}$/.test(result.sha) || !result.branch || !result.defaultBranch ||
      !result.target || [result.target, result.defaultBranch].includes(result.branch)) {
    throw new Error('Cannot verify the delivered source ref and its ticket.');
  }
  return { delivery: result, clone };
}

export function confirmBranchEligible(delivery: CleanupDelivery, existsRemotely: boolean): void {
  const { provider, host, repository, branch } = delivery;
  const ref = encodeURIComponent(branch);
  if (provider === 'github') {
    const path = `repos/${repository}`;
    const head = encodeURIComponent(`${repository.split('/')[0]}:${branch}`);
    const open = api<unknown[]>('gh', host, `${path}/pulls?state=open&head=${head}`);
    if (open.length) throw new Error('An open pull request uses this branch.');
    if (existsRemotely && api<{ protected: boolean }>('gh', host, `${path}/branches/${ref}`).protected !== false) {
      throw new Error('The remote branch is protected or its protection state is unknown.');
    }
  } else {
    const path = `projects/${encodeURIComponent(repository)}`;
    const open = api<unknown[]>('glab', host, `${path}/merge_requests?state=opened&source_branch=${ref}`);
    if (open.length) throw new Error('An open merge request uses this branch.');
    if (existsRemotely && api<{ protected: boolean }>('glab', host, `${path}/repository/branches/${ref}`).protected !== false) {
      throw new Error('The remote branch is protected or its protection state is unknown.');
    }
  }
}
