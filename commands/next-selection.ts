export type NextResult =
  | { name: string; id: string; url: string; list: string }
  | { status: 'no eligible item' };

export type StatusCategory = 'waiting' | 'review' | 'other';

type Candidate = {
  name: unknown;
  id: unknown;
  url: unknown;
  list: unknown;
  status: string | null;
  labels: string[];
  updatedAt: unknown;
};

const knownStatuses: Record<string, StatusCategory> = {
  open: 'waiting',
  review: 'review',
  'in review': 'review',
  'in progress': 'other',
  done: 'other',
  closed: 'other',
  canceled: 'other',
  cancelled: 'other',
};

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function named(value: unknown): unknown {
  return object(value)?.name;
}

export function normalizeClickUpPage(page: unknown): Candidate[] {
  if (!Array.isArray(page)) throw new Error('ClickUp did not return a task array');
  return page.map((value, index) => {
    const task = object(value);
    if (!task) throw new Error(`Invalid task at index ${index}`);
    if (!Array.isArray(task.tags) || !task.tags.every(tag => typeof named(tag) === 'string')) {
      throw new Error(`Incomplete labels at index ${index}`);
    }
    const status = object(task.status)?.status;
    return {
      name: task.name,
      id: task.id,
      url: task.url,
      list: named(task.list),
      status: typeof status === 'string' && status.trim() ? status.trim() : null,
      labels: task.tags.map(tag => named(tag) as string),
      updatedAt: task.date_updated,
    };
  });
}

export function unresolvedStatuses(candidates: Candidate[]): string[] {
  const unresolved = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate.labels.includes('agent-planned') || !candidate.status) continue;
    if (!(candidate.status.toLowerCase() in knownStatuses)) unresolved.add(candidate.status);
  }
  return [...unresolved];
}

export function selectNext(candidates: Candidate[], classifications: Record<string, StatusCategory> = {}): NextResult {
  let selected: Candidate | null = null;
  let oldest = Infinity;
  for (const candidate of candidates) {
    if (!candidate.labels.includes('agent-planned') || !candidate.status) continue;
    const category = knownStatuses[candidate.status.toLowerCase()] ?? classifications[candidate.status];
    if (!category) throw new Error(`Unclassified status: ${candidate.status}`);
    if (category === 'other' || (category === 'review' && candidate.labels.includes('agent-inspected'))) continue;
    const timestamp = candidate.updatedAt;
    if (typeof timestamp !== 'string' || !/^\d+$/.test(timestamp) ||
        !Number.isSafeInteger(Number(timestamp)) || Number(timestamp) < 0) {
      throw new Error('Invalid eligible task timestamp');
    }
    const updatedAt = Number(timestamp);
    if (updatedAt < oldest) {
      selected = candidate;
      oldest = updatedAt;
    }
  }
  if (!selected) return { status: 'no eligible item' };
  for (const key of ['name', 'id', 'url', 'list'] as const) {
    if (typeof selected[key] !== 'string' || !selected[key].trim()) {
      throw new Error(`Selected task has no ${key}`);
    }
  }
  return {
    name: selected.name as string,
    id: selected.id as string,
    url: selected.url as string,
    list: selected.list as string,
  };
}
