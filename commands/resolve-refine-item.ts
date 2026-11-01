import { execFileSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { parseItemArguments, resolveItemContext } from './resolve-existing-item.ts';
import { resolveItemProvider } from './resolve-item-provider.ts';

export function resolveRefineItem(provider: 'linear' | 'clickup', reference = '',
  query = '', run = execFileSync) {
  if (!reference.trim() && !query.trim()) {
    return { status: 'needs_reference' as const, provider };
  }
  const result = resolveItemContext(provider, reference, query);
  if (result.status !== 'resolved') return result;
  const item = result.item;
  const relations = provider === 'linear'
    ? run('linear', ['issue', 'relation', 'list', item.identifier!, '--no-input'],
      { encoding: 'utf8' }).toString()
    : null;
  return { ...result, item: { ...item, relations } };
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
    process.stdout.write(`${JSON.stringify(resolveRefineItem(provider, reference, query))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
