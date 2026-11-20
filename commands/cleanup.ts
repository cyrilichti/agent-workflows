import { basename, dirname, join } from 'node:path';
import { cleanupBranches, findCleanupClone } from './cleanup-clone.ts';
import { cleanupWindow, completedItems, readCleanupDelivery } from './cleanup-remote.ts';
import { resolveItemProvider } from './resolve-item-provider.ts';

function reason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const [action, ...args] = process.argv.slice(2);
try {
  const parent = dirname(import.meta.dirname);
  const root = basename(parent) === '.agents' ? dirname(parent) : parent;
  const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
  if (provider !== 'linear' && provider !== 'clickup') {
    throw new Error('Expected an active Linear or ClickUp provider.');
  }

  if (action === 'select') {
    const [from = '', until = '', activation = ''] = args;
    const items = completedItems(provider, cleanupWindow(from, until, activation));
    process.stdout.write(JSON.stringify({ provider, items }));
  } else if (action === 'clean') {
    const selection = JSON.parse(args[0] ?? '') as { provider: string; items: string[] };
    if (selection.provider !== provider) throw new Error('The item provider changed after selection.');
    const results = selection.items.map(id => {
      try {
        const { delivery, clone } = readCleanupDelivery(provider, id, findCleanupClone);
        return { id, request: delivery.request, clone: clone.path, branch: delivery.branch,
          ...cleanupBranches(clone, delivery) };
      } catch (error) {
        return { id, reason: reason(error) };
      }
    });
    const error = results.flatMap(result => result.reason ? [`${result.id}: ${result.reason}`] : []).join('\n');
    process.stdout.write(JSON.stringify({ results, error: error || undefined }));
  } else {
    throw new Error('Specify select or clean.');
  }
} catch (error) {
  process.stdout.write(JSON.stringify({ error: reason(error) }));
}
