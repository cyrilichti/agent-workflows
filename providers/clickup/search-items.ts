import type { ItemMatch } from '../../commands/search-items.ts';
import { readJson } from './read-item.ts';

function normalizedTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function searchItems(query: string): ItemMatch[] {
  const tasks = readJson(['task', 'search', '--page', '0', '--include-closed', '--subtasks', '--output', 'json']) as Array<{
    id: string; name: string; status?: { status: string }; list?: { name: string };
  }>;
  const phrase = normalizedTitle(query);
  return tasks.filter(task => normalizedTitle(task.name).includes(phrase))
    .sort((a, b) => Number(normalizedTitle(b.name) === phrase) - Number(normalizedTitle(a.name) === phrase))
    .slice(0, 5).map(task => ({ provider_id: task.id, title: task.name,
      status: task.status?.status ?? null, destination: task.list?.name ?? null }));
}
