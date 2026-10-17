import { execFileSync } from 'node:child_process';
import type { Candidate, StatusCategory } from '../../commands/select-next-item.ts';

const knownStatuses: Record<string, StatusCategory> = {
  open: 'waiting',
  backlog: 'waiting',
  todo: 'waiting',
  review: 'review',
  'in review': 'review',
  'in progress': 'other',
  triage: 'other',
  started: 'other',
  completed: 'other',
  duplicate: 'other',
  done: 'other',
  closed: 'other',
  canceled: 'other',
  cancelled: 'other',
};

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function named(value: unknown): unknown {
  return object(value)?.name;
}

function normalizePage(page: unknown): Candidate[] {
  if (!Array.isArray(page)) throw new Error('ClickUp did not return a task array');
  return page.map((value, index) => {
    const task = object(value);
    if (!task) throw new Error(`Invalid task at index ${index}`);
    if (!Array.isArray(task.tags) || !task.tags.every(tag => typeof named(tag) === 'string')) {
      throw new Error(`Incomplete labels at index ${index}`);
    }
    const rawStatus = object(task.status)?.status;
    const status = typeof rawStatus === 'string' && rawStatus.trim() ? rawStatus.trim() : null;
    return {
      name: task.name,
      id: task.id,
      url: task.url,
      list: named(task.list),
      category: status ? knownStatuses[status.toLowerCase()] ?? null : null,
      labels: task.tags.map(tag => named(tag) as string),
      updatedAt: task.date_updated,
    };
  });
}

export function fetchCandidates(): Candidate[] {
  let output: string;
  try {
    output = execFileSync('clickup-cli', ['task', 'search', '--tag', 'agent-planned', '--page', '0', '--output', 'json'], {
      encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    throw new Error('ClickUp query failed');
  }
  return normalizePage(JSON.parse(output));
}
