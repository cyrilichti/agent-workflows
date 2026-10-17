export type NextResult =
  | { name: string; id: string; url: string; list: string }
  | { status: 'no eligible item' };

export type StatusCategory = 'waiting' | 'review' | 'other';

export type Candidate = {
  name: unknown;
  id: unknown;
  url: unknown;
  list: unknown;
  category: StatusCategory | null;
  labels: string[];
  updatedAt: unknown;
};

export function selectNext(candidates: Candidate[]): NextResult {
  let selected: Candidate | null = null;
  let oldest = Infinity;
  for (const candidate of candidates) {
    if (!candidate.labels.includes('agent-planned')) continue;
    const category = candidate.category;
    if (category === 'other' || (category === 'review' && candidate.labels.includes('agent-inspected'))) continue;
    if (!category) continue;
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
