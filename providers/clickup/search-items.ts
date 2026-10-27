import type { ItemMatch } from '../../commands/search-items.ts';
import { readJson } from './read-item.ts';

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function searchItems(query: string): ItemMatch[] {
  const tasks = readJson([
    'task',
    'search',
    '--page',
    '0',
    '--include-closed',
    '--subtasks',
    '--output',
    'json',
  ]) as Array<{
    id: string;
    name: string;
    status?: { status: string };
    list?: { name: string };
  }>;
  const phrase = normalizeTitle(query);
  return tasks
    .filter((task) => {
      return normalizeTitle(task.name).includes(phrase);
    })
    .sort((a, b) => {
      return Number(normalizeTitle(b.name) === phrase) - Number(normalizeTitle(a.name) === phrase);
    })
    .slice(0, 5)
    .map((task) => {
      return {
        provider_id: task.id,
        title: task.name,
        status: task.status?.status ?? null,
        destination: task.list?.name ?? null,
      };
    });
}
