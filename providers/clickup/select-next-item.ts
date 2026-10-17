import { execFileSync } from 'node:child_process';

type Task = {
  name: string;
  id: string;
  url: string;
  list: { name: string } | null;
  status?: { status?: string };
  tags: Array<{ name: string }>;
  date_updated: unknown;
};

const categories: Record<string, 'waiting' | 'review'> = {
  open: 'waiting',
  backlog: 'waiting',
  todo: 'waiting',
  'to do': 'waiting',
  review: 'review',
  'in review': 'review',
};

export function fetchCandidates() {
  let output: string;
  try {
    output = execFileSync('clickup-cli', ['task', 'search', '--tag', 'agent-planned', '--page', '0', '--output', 'json'], {
      encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    throw new Error('ClickUp query failed');
  }
  const tasks = JSON.parse(output) as Task[];
  return tasks.map(task => {
    const status = task.status?.status?.trim().toLowerCase();
    return {
      name: task.name,
      id: task.id,
      url: task.url,
      list: task.list?.name ?? null,
      category: status ? categories[status] ?? null : null,
      labels: task.tags.map(tag => tag.name),
      updatedAt: task.date_updated,
    };
  });
}
