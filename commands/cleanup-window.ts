import { execFileSync } from 'node:child_process';
import { readJson as readClickUpJson } from '../providers/clickup/read-item.ts';
import type { ItemProvider } from './read-item.ts';

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

function linearCompleted(window: CleanupWindow, id?: string): string[] {
  if (id) {
    const result = linearQuery<{ data?: { issue?: LinearIssue }; errors?: unknown[] }>(
      'query CleanupTicket($id: String!) { issue(id: $id) { id completedAt state { type } } }', { id });
    const item = result.data?.issue;
    if (result.errors?.length || !item || item.id !== id) throw new Error('Cannot read the Linear issue.');
    return item.state.type === 'completed' && within(window, Date.parse(item.completedAt ?? '')) ? [id] : [];
  }
  const query = `query CleanupTickets($start: DateTimeOrDuration!, $end: DateTimeOrDuration!, $after: String) {
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
    const variables = { start: new Date(window.start).toISOString(),
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

function clickupCompleted(window: CleanupWindow, id?: string): string[] {
  if (id) {
    const tasks = readClickUpJson(['task', 'get', id, '--output', 'json']) as ClickUpTask[];
    const item = Array.isArray(tasks) && tasks.length === 1 ? tasks[0] : undefined;
    if (!item || item.id !== id) throw new Error('Cannot read the ClickUp task.');
    return item.status?.type === 'done' && within(window, Number(item.date_done ?? NaN)) ? [id] : [];
  }
  const matches = new Set<string>();
  const pages = new Set<string>();
  for (let page = 0; ; page++) {
    const tasks = readClickUpJson(['task', 'search', '--tag', 'agent-inspected', '--subtasks',
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

export function completedTickets(provider: ItemProvider, window: CleanupWindow, id?: string): string[] {
  if (window.start === window.end) return [];
  return provider === 'linear' ? linearCompleted(window, id) : clickupCompleted(window, id);
}
