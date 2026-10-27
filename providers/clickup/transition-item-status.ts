import { execFileSync } from 'node:child_process';

type NativeStatus = { id?: string; status?: string; name?: string; type?: string };
export type ItemStatus = { id: string; name: string; category: 'active' | 'review' | 'completed' | 'other' };

function normalize(status: NativeStatus): ItemStatus {
  const name = status.status ?? status.name ?? '';
  const type = status.type?.toLowerCase();
  let category: ItemStatus['category'] = 'other';
  if (type === 'done' || type === 'closed') {
    category = 'completed';
  } else if (type === 'custom') {
    category = 'active';
  }
  return { id: String(status.id ?? name), name, category };
}

export function readStatuses(itemId: string, officialItem?: Record<string, unknown>): {
  current_status: ItemStatus; available_statuses: ItemStatus[]; item_reference: string;
} {
  let task: Record<string, unknown>;
  if (officialItem?.status && officialItem?.list) {
    task = officialItem;
  } else {
    const output = execFileSync('clickup-cli', ['task', 'get', itemId, '--output', 'json'], {
      encoding: 'utf8',
    });
    task = JSON.parse(output) as Record<string, unknown>;
  }
  const listId = (task.list as { id: string }).id;
  const listOutput = execFileSync('clickup-cli', ['list', 'get', listId, '--output', 'json'], {
    encoding: 'utf8',
  });
  const list = JSON.parse(listOutput) as { statuses: NativeStatus[] };
  return {
    current_status: normalize(task.status as NativeStatus),
    available_statuses: list.statuses.map(normalize),
    item_reference: itemId,
  };
}

export function applyStatus(itemId: string, target: ItemStatus): ItemStatus {
  const output = execFileSync('clickup-cli', [
    'task', 'update', itemId, '--status', target.name, '--output', 'json',
  ], { encoding: 'utf8' });
  const result = JSON.parse(output) as { status: NativeStatus };
  if (!result.status) {
    throw new Error('ClickUp did not return the resulting status.');
  }
  return normalize(result.status);
}
