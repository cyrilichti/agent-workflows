import { readFileSync } from 'node:fs';
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

if (import.meta.main) {
  try {
    const item = JSON.parse(readFileSync(0, 'utf8')) as WorkItem;
    if (!item || !Array.isArray(item.labels)) {
      throw new Error('Complete official item context with labels is required.');
    }
    process.stdout.write(`${JSON.stringify(classifyPickItem(item))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage: 'classify_item',
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
