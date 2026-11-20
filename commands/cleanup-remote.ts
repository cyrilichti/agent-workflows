import { execFileSync } from 'node:child_process';
import { readJson } from '../providers/clickup/read-item.ts';
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

function githubDelivery(url: URL, repository: string, number: string): CleanupDelivery {
  const pull = api<{
    number: number; merged: boolean;
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
    defaultBranch: pull.base.repo.default_branch, sha: pull.head.sha };
}

function gitlabDelivery(url: URL, repository: string, number: string): CleanupDelivery {
  const projectPath = encodeURIComponent(repository);
  const merge = api<{
    iid: number; state: string; source_project_id: number | null;
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
    sha: merge.sha };
}

export function readCleanupDelivery<T>(provider: ItemProvider, id: string,
  identifyClone: (repository: CleanupRepository) => T,
): { delivery: CleanupDelivery; clone: T } {
  const item = readItem(provider, id);
  if (item.request_backlinks.length !== 1) throw new Error('Expected one delivery backlink.');
  const url = new URL(item.request_backlinks[0]!);
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
  if (!/^[0-9a-f]{40,64}$/.test(delivery.sha) || !delivery.branch || !delivery.defaultBranch ||
      !delivery.target || [delivery.target, delivery.defaultBranch].includes(delivery.branch)) {
    throw new Error('Cannot identify the delivered source ref.');
  }
  return { delivery, clone };
}

export type CleanupWindow = { start: number; end: number };

export function cleanupWindow(start: string, end: string, activation: string): CleanupWindow {
  const times = [start, end, activation].map(value =>
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)
      ? Date.parse(value) : NaN);
  const [lower, upper, cutoff] = times as [number, number, number];
  if (times.some(value => !Number.isFinite(value)) || lower >= upper ||
      upper - lower > 3_600_000 || upper > Date.now()) {
    throw new Error('Supply a completed cleanup interval of at most one hour and an activation timestamp.');
  }
  return { start: Math.min(upper, Math.max(lower, cutoff)), end: upper };
}

type LinearIssue = { id: string; completedAt: string | null; state: { type: string } };
type LinearPage = {
  data?: { issues: {
    nodes: LinearIssue[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  } };
  errors?: unknown[];
};

function within(window: CleanupWindow, time: number): boolean {
  return time >= window.start && time < window.end;
}

function linearQuery<T>(query: string, variables: Record<string, string | null>): T {
  return JSON.parse(execFileSync('linear',
    ['--no-input', 'api', '--variables-json', JSON.stringify(variables)],
    { input: query, encoding: 'utf8', timeout: 30_000 })) as T;
}

function linearCompleted(window: CleanupWindow): string[] {
  const query = `query CleanupItems($start: DateTimeOrDuration!, $end: DateTimeOrDuration!, $after: String) {
    issues(first: 100, after: $after, filter: {
      completedAt: { gte: $start, lt: $end }, labels: { name: { eq: "agent-inspected" } }
    }) {
      nodes { id completedAt state { type } }
      pageInfo { hasNextPage endCursor }
    }
  }`;
  const seen = new Set<string>();
  const matches = new Set<string>();
  let cursor: string | null = null;
  do {
    const variables: Record<string, string | null> = { start: new Date(window.start).toISOString(),
      end: new Date(window.end).toISOString(), after: cursor };
    const result = linearQuery<LinearPage>(query, variables);
    const issues = result.data?.issues;
    if (result.errors?.length || !issues) throw new Error('Cannot list completed Linear issues.');
    for (const item of issues.nodes) {
      const time = Date.parse(item.completedAt ?? '');
      if (item.state.type === 'completed' && within(window, time)) matches.add(item.id);
    }
    cursor = issues.pageInfo.hasNextPage ? issues.pageInfo.endCursor : null;
    if (issues.pageInfo.hasNextPage && (!cursor || seen.has(cursor))) {
      throw new Error('Linear pagination did not advance.');
    }
    if (cursor) seen.add(cursor);
  } while (cursor);
  return [...matches];
}

type ClickUpTask = { id: string; date_done?: string | null; status?: { type?: string } };

function clickupCompleted(window: CleanupWindow): string[] {
  const matches = new Set<string>();
  const pages = new Set<string>();
  for (let page = 0; ; page++) {
    const tasks = readJson(['task', 'search', '--tag', 'agent-inspected', '--subtasks',
      '--include-closed', '--page', String(page), '--output', 'json']) as
      ClickUpTask[];
    if (!Array.isArray(tasks)) throw new Error('Cannot list completed ClickUp tasks.');
    for (const item of tasks) {
      const time = Number(item.date_done ?? NaN);
      if (item.status?.type === 'done' && within(window, time)) matches.add(item.id);
    }
    if (tasks.length < 100) return [...matches];
    const key = tasks.map(task => task.id).join(',');
    if (pages.has(key)) throw new Error('ClickUp pagination did not advance.');
    pages.add(key);
  }
}

export function completedItems(provider: ItemProvider, window: CleanupWindow): string[] {
  if (window.start === window.end) return [];
  return provider === 'linear' ? linearCompleted(window) : clickupCompleted(window);
}
