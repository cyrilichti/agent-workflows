import { basename, dirname, join } from 'node:path';
import { cleanupBranches, findCleanupClone } from './cleanup-clone.ts';
import { cleanupWindow, completedTickets, readCleanupDelivery } from './cleanup-remote.ts';
import { resolveItemProvider } from './resolve-item-provider.ts';

const [action, from, until, activation, expectedProvider, id] = process.argv.slice(2);
const bounds = { from, until };
try {
  const parent = dirname(import.meta.dirname);
  const root = basename(parent) === '.agents' ? dirname(parent) : parent;
  const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
  if (provider !== 'linear' && provider !== 'clickup') throw new Error('Expected an active Linear or ClickUp provider.');
  const window = cleanupWindow(from ?? '', until ?? '', activation ?? '');
  if (action === 'select') {
    const tickets = completedTickets(provider, window);
    process.stdout.write(JSON.stringify({ status: 'selected', provider, ...bounds, tickets }));
  } else if (action === 'remove' && id && expectedProvider === provider) {
    if (!completedTickets(provider, window, id).length) {
      throw new Error('The ticket is no longer completed within this interval.');
    }
    const { delivery, clone } = readCleanupDelivery(provider, id, findCleanupClone);
    const outcome = cleanupBranches(clone, delivery);
    process.stdout.write(JSON.stringify({ status: outcome.reason ? 'blocked' : 'complete', provider,
      ...bounds, id, request: delivery.request, clone: clone.path, branch: delivery.branch, ...outcome }));
  } else {
    throw new Error('Specify select, or remove with the selected provider and ticket ID.');
  }
} catch (error) {
  process.stdout.write(JSON.stringify({ status: 'failed', ...bounds, id,
    reason: error instanceof Error ? error.message : String(error) }));
}
