import { basename, dirname, join } from 'node:path';
import { parseItemArguments, resolveItemContext } from './resolve-existing-item.ts';
import { resolveItemProvider } from './resolve-item-provider.ts';
import type { WorkItem } from './read-item.ts';

export function classifyPickItem(item: WorkItem) {
  if (item.closed !== false) {
    return { status: 'ineligible' as const, reason: item.closed === true
      ? 'closed' as const : 'openness_unavailable' as const, item };
  }
  if (item.labels.includes('agent-planned')) {
    return { status: 'already_planned' as const, item };
  }
  if (!item.labels.includes('agent-shaped')) {
    return { status: 'ineligible' as const, reason: 'missing_agent_shaped' as const, item };
  }
  return { status: 'eligible' as const, item };
}

export function resolvePickItem(provider: 'linear' | 'clickup', reference = '', query = '') {
  const result = resolveItemContext(provider, reference, query, true);
  if (result.status !== 'resolved') return result;
  return { provider, ...classifyPickItem(result.item) };
}

if (import.meta.main) {
  let stage = 'resolve_item_provider';
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    process.chdir(root);
    const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
    if (provider !== 'linear' && provider !== 'clickup') {
      throw new Error('Configure item provider as linear or clickup.');
    }
    stage = 'resolve_item';
    const args = process.argv.slice(2);
    const { reference, query } = args.length ? parseItemArguments(args) :
      { reference: '', query: '' };
    process.stdout.write(`${JSON.stringify(resolvePickItem(provider, reference, query))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
