import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';
import { resolveExistingItem } from './resolve-existing-item.ts';
import { readItem } from './read-item.ts';
import type { ItemProvider } from './read-item.ts';
import { prepareStandaloneWork } from './work-standalone.ts';
import { resolveRequestForProject } from './resolve-request.ts';

const parent = dirname(import.meta.dirname);
const root = basename(parent) === '.agents' ? dirname(parent) : parent;

export async function prepareStandaloneReady(
  projectRoot: string,
  provider: ItemProvider,
  item: ReturnType<typeof readItem>,
  resolveRequest?: Parameters<typeof prepareStandaloneWork>[4],
) {
  if (!item.request_backlinks.length) {
    throw new Error('Item has no linked pull or merge request and local plan.');
  }
  const result = await prepareStandaloneWork(projectRoot, provider, item,
    undefined, resolveRequest);
  if (result.work_mode !== 'resumed' || !result.delivery_context.request) {
    throw new Error('Ready requires an existing linked request and local plan.');
  }
  return { status: 'resolved' as const, delivery_context: result.delivery_context };
}

if (import.meta.main) {
  let stage = 'resolve_item_provider';
  try {
    const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
    if (provider !== 'linear' && provider !== 'clickup') {
      throw new Error('Configure item provider as linear or clickup.');
    }
    stage = 'resolve_item';
    const [input, query] = process.argv.slice(2);
    const reference = input === '--query'
      ? resolveExistingItem(provider, undefined, query)
      : resolveExistingItem(provider, input);
    stage = 'read_item';
    const item = readItem(provider, reference);
    if (!item.request_backlinks.length) {
      throw new Error('Item has no linked pull or merge request and local plan.');
    }
    stage = 'resolve_request';
    const request = resolveRequestForProject(root, undefined, item.request_backlinks, undefined);
    stage = 'prepare_context';
    const result = await prepareStandaloneReady(root, provider, item, () => request);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
