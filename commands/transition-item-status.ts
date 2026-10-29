import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

type Status = {
  id: string;
  name: string;
  category: 'active' | 'review' | 'completed' | 'other';
};
type Adapter = {
  readStatuses(itemId: string, officialItem?: Record<string, unknown>): {
    current_status: Status;
    available_statuses: Status[];
    item_reference: string;
  };
  applyStatus(itemId: string, target: Status): Status;
};
type Input = { item_id: string; official_item?: Record<string, unknown>;
  target_status?: 'in progress' | 'review' };

try {
  const parent = dirname(import.meta.dirname);
  let root = parent;
  if (basename(parent) === '.agents') {
    root = dirname(parent);
  }
  process.chdir(root);
  const data = JSON.parse(readFileSync(0, 'utf8')) as Input;
  const itemId = data.item_id;
  const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
  const adapter = await import(`../providers/${provider}/transition-item-status.ts`) as Adapter;
  const resolution = adapter.readStatuses(itemId, data.official_item);
  const targetStatus = data.target_status ?? 'in progress';
  const candidates = targetStatus === 'review'
    ? resolution.available_statuses.filter(status => status.category === 'review' ||
      /\b(review|revue|examen)\b/i.test(status.name))
    : resolution.available_statuses.filter(status => status.category === 'active');
  const exact = targetStatus === 'in progress'
    ? candidates.filter(status => status.name.toLowerCase() === 'in progress') : [];
  const matches = exact.length === 1 ? exact : candidates;
  if (matches.length === 0) {
    throw new Error(targetStatus === 'review'
      ? 'No review status is available.' : 'No active status is available.');
  }
  if (matches.length > 1) {
    throw new Error(targetStatus === 'review'
      ? 'Multiple review statuses are available.' : 'Multiple active statuses are available.');
  }
  const target = matches[0]!;
  const itemReference = resolution.item_reference;
  if (!itemReference) {
    throw new Error('Item CLI reference is unavailable.');
  }
  const resulting = adapter.applyStatus(itemReference, target);
  process.stdout.write(`${JSON.stringify({
    status: 'transitioned',
    item_reference: itemReference,
    previous_status: resolution.current_status,
    resolved_target_status: target,
    resulting_status: resulting,
  })}\n`);
} catch (error) {
  let reason = String(error);
  if (error instanceof Error) {
    reason = error.message;
  }
  process.stdout.write(`${JSON.stringify({
    status: 'failed',
    stage: 'start_item',
    reason,
  })}\n`);
  process.exitCode = 1;
}
