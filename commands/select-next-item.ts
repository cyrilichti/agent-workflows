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
  updatedAt: number;
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
    if (!Number.isSafeInteger(candidate.updatedAt)) {
      throw new Error('Invalid eligible task timestamp');
    }
    if (candidate.updatedAt < oldest) {
      selected = candidate;
      oldest = candidate.updatedAt;
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

const parent = dirname(import.meta.dirname);
const root = basename(parent) === '.agents' ? dirname(parent) : parent;
const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
if (process.argv[2] === '--provider' && provider !== 'clickup' && provider !== 'linear') {
  throw new Error(`Unsupported item provider: ${provider}. Supported values: clickup, linear.`);
}
process.chdir(root);
const adapter: { fetchCandidates(): Candidate[] } = await import(`../providers/${provider}/select-next-item.ts`);
process.stdout.write(process.argv[2] === '--provider'
  ? `${provider}\n`
  : `${JSON.stringify(selectNext(adapter.fetchCandidates()))}\n`);
