import { basename, dirname, join } from 'node:path';
import { applyItemLabel } from './apply-item-label.ts';
import type { ItemProvider } from './read-item.ts';
import { resolveItemProvider } from './resolve-item-provider.ts';

type LabelResult = { applied: boolean; reason?: string };
type ApplyLabel = (provider: ItemProvider,
  input: { item_id: string; label: string }) => LabelResult;

export function applyHotfixLabels(provider: ItemProvider, itemId: string,
  applyLabel: ApplyLabel = applyItemLabel) {
  if (!itemId?.trim()) throw new Error('Saved item ID is required.');
  const apply = (label: string): LabelResult => {
    try {
      return applyLabel(provider, { item_id: itemId, label });
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
  return { status: 'prepared' as const, provider, item_id: itemId, labels };
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
    stage = 'apply_hotfix_labels';
    const result = applyHotfixLabels(provider, process.argv[2] ?? '');
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.status === 'failed') process.exitCode = 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
