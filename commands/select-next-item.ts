import { join, dirname, basename } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

type NextResult =
  | { name: string; id: string; url: string; list: string }
  | { status: 'no eligible item' };

type Candidate = {
  name: string;
  id: string;
  url: string;
  list: string | null;
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
  if (!selected.list) {
    throw new Error('Selected item has no destination');
  }
  return {
    name: selected.name,
    id: selected.id,
    url: selected.url,
    list: selected.list,
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
  process.stdout.write(`${JSON.stringify(selectNext(adapter.fetchCandidates()))}\n`);
}

await main();
