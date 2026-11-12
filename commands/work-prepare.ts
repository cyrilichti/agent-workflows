import { spawnSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { prepareDeliveryContext } from './prepare-delivery-context.ts';
import { readItem } from './read-item.ts';
import { resolveExistingItem } from './resolve-existing-item.ts';
import { resolveItemProvider } from './resolve-item-provider.ts';

const parent = dirname(import.meta.dirname);
const root = basename(parent) === '.agents' ? dirname(parent) : parent;
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
  if (item.closed !== false || !item.labels.includes('agent-planned')) {
    throw new Error(`Item ${item.identifier ?? item.id} must be open and labeled agent-planned.`);
  }

  stage = 'start_item';
  const transition = spawnSync(process.execPath,
    [join(import.meta.dirname, 'transition-item-status.ts')], {
      cwd: root,
      encoding: 'utf8',
      input: JSON.stringify({ item_id: item.id }),
    });
  if (transition.error) throw transition.error;
  const output = JSON.parse(transition.stdout) as {
    status: string; reason?: string; resulting_status?: unknown;
  };
  if (transition.status !== 0 || output.status !== 'transitioned' ||
    !output.resulting_status) {
    throw new Error(output.reason || 'Item did not enter in progress.');
  }

  stage = 'prepare_context';
  const result = await prepareDeliveryContext(root, provider,
    { ...item, status: output.resulting_status });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({
    status: 'failed', stage,
    reason: error instanceof Error ? error.message : String(error),
  })}\n`);
  process.exitCode = 1;
}
