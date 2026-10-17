import { join, dirname, basename } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

type NextResult =
  | { name: string; id: string; url: string; list: string }
  | { status: 'no eligible item' };

type Candidate = {
  name: unknown;
  id: unknown;
  url: unknown;
  list: unknown;
  category: 'waiting' | 'review' | null;
  labels: string[];
  updatedAt: unknown;
};

function selectNext(candidates: Candidate[]): NextResult {
  let selected: Candidate | null = null;
  let oldest = Infinity;
  for (const candidate of candidates) {
    if (!candidate.labels.includes('agent-planned')) {
      continue;
    }
    if (candidate.category !== 'waiting' && candidate.category !== 'review') {
      continue;
    }
    if (candidate.category === 'review' && candidate.labels.includes('agent-inspected')) {
      continue;
    }
    const timestamp = candidate.updatedAt;
    const updatedAt = Number(timestamp);
    if (typeof timestamp !== 'string' || !/^\d+$/.test(timestamp) || !Number.isSafeInteger(updatedAt)) {
      throw new Error('Invalid eligible task timestamp');
    }
    if (updatedAt < oldest) {
      selected = candidate;
      oldest = updatedAt;
    }
  }
  if (!selected) {
    return { status: 'no eligible item' };
  }
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

function projectRoot(): string {
  const parent = dirname(import.meta.dirname);
  return basename(parent) === '.agents' ? dirname(parent) : parent;
}

async function main(): Promise<void> {
  const root = projectRoot();
  const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
  process.chdir(root);
  const adapter: { fetchCandidates(): Candidate[] } = await import(`../providers/${provider}/select-next-item.ts`);
  console.log(JSON.stringify(selectNext(adapter.fetchCandidates())));
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`next: ${message}`);
  process.exitCode = 1;
});
