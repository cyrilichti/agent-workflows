import { basename, dirname, join } from 'node:path';
import { applyItemLabel } from './apply-item-label.ts';
import { classifyPickItem } from './classify-pick-item.ts';
import { readItem } from './read-item.ts';
import type { ItemProvider, WorkItem } from './read-item.ts';
import { resolveItemProvider } from './resolve-item-provider.ts';

type LabelResult = { applied: boolean; reason?: string };
type Dependencies = {
  applyLabel: (provider: ItemProvider, input: { item_id: string; label: string }) => LabelResult;
  read: (provider: ItemProvider, id: string, includeRelations: boolean) => WorkItem;
};

// Label mutations confirm operations; the independent read establishes handoff eligibility.
export function prepareHotfixItem(provider: ItemProvider, itemId: string,
  dependencies: Dependencies = { applyLabel: applyItemLabel, read: readItem }) {
  if (!itemId?.trim()) throw new Error('Saved item ID is required.');
  const apply = (label: string): LabelResult => {
    try {
      return dependencies.applyLabel(provider, { item_id: itemId, label });
    } catch (error) {
      return { applied: false, reason: error instanceof Error ? error.message : String(error) };
    }
  };
  const labels = { 'agent-shaped': apply('agent-shaped'), hotfix: apply('hotfix') };
  if (!labels['agent-shaped'].applied) {
    return { status: 'failed' as const, stage: 'apply_agent_shaped',
      reason: labels['agent-shaped'].reason ?? 'agent-shaped application was not confirmed.',
      provider, item_id: itemId, labels };
  }
  let item: WorkItem;
  try {
    item = dependencies.read(provider, itemId, true);
    if (item.id !== itemId) throw new Error('Read returned a different item ID.');
  } catch (error) {
    return { status: 'failed' as const, stage: 'verify_item',
      reason: error instanceof Error ? error.message : String(error),
      provider, item_id: itemId, labels };
  }
  const eligibility = classifyPickItem(item);
  if (eligibility.status !== 'eligible') {
    return { status: 'failed' as const, stage: 'classify_item',
      reason: eligibility.status === 'already_planned' ? 'already_planned' : eligibility.reason,
      provider, item, labels };
  }
  return { status: 'prepared' as const, provider, item, labels };
}

if (import.meta.main) {
  let stage = 'resolve_item_provider';
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
    if (provider !== 'linear' && provider !== 'clickup') {
      throw new Error('Configure item provider as linear or clickup.');
    }
    stage = 'prepare_hotfix_item';
    const result = prepareHotfixItem(provider, process.argv[2] ?? '');
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.status === 'failed') process.exitCode = 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
