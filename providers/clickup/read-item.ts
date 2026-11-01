import { execFileSync } from 'node:child_process';
import type { ItemComment, WorkItem } from '../../commands/read-item.ts';

type Comment = { id: string; date: string; comment?: { text: string }[] };
export function readJson(args: string[]): unknown {
  const output = execFileSync('clickup-cli', args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // The CLI can write warnings before its JSON payload.
  const start = output.search(/^[\[{]/m);
  return JSON.parse(output.slice(start));
}

export function readItem(reference: string): Omit<WorkItem, 'request_backlinks'> {
  const tasks = readJson(['task', 'get', reference, '--markdown', '--output', 'json']) as Array<{
    id: string;
    name: string;
    url: string;
    markdown_description?: string;
    description?: string;
    status?: { type?: string };
    date_closed?: string | null;
    tags?: { name: string }[];
    attachments?: unknown[];
    linked_tasks?: unknown[];
    list: unknown;
    folder: unknown;
    space: unknown;
  }>;
  if (tasks.length !== 1) {
    throw new Error('Expected one official ClickUp task.');
  }
  const task = tasks[0]!;
  if (
    !Array.isArray(task.tags) ||
    !task.tags.every((tag) => {
      return typeof tag.name === 'string';
    })
  ) {
    throw new Error('Complete ClickUp labels are unavailable.');
  }
  const comments: ItemComment[] = [];
  const seen = new Set<string>();
  const boundaries = new Set<string>();
  let cursor: Comment | undefined;
  while (true) {
    const args = ['comment', 'list', '--task', task.id, '--output', 'json'];
    if (cursor) {
      args.push('--start', cursor.date, '--start-id', cursor.id);
    }
    const page = readJson(args) as Comment[];
    if (!Array.isArray(page)) {
      throw new Error('Cannot read ClickUp comments.');
    }
    for (const comment of page) {
      if (
        !Array.isArray(comment.comment) ||
        !comment.comment.every((block) => {
          return typeof block.text === 'string';
        })
      ) {
        throw new Error('Complete ClickUp comment text is unavailable.');
      }
      if (!seen.has(comment.id)) {
        comments.push({
          id: comment.id,
          body: comment.comment
            .map((block) => {
              return block.text;
            })
            .join(''),
        });
        seen.add(comment.id);
      }
    }
    if (page.length < 25) {
      break;
    }
    cursor = page.at(-1)!;
    const boundary = `${cursor.date}:${cursor.id}`;
    if (!cursor.date || !cursor.id || boundaries.has(boundary)) {
      throw new Error('ClickUp comment pagination did not advance.');
    }
    boundaries.add(boundary);
  }
  return {
    id: task.id,
    title: task.name,
    description: task.markdown_description ?? task.description ?? '',
    url: task.url,
    status: task.status,
    closed:
      task.status?.type === 'closed' || Boolean(task.date_closed)
        ? true
        : task.status?.type || task.date_closed === null
          ? false
          : null,
    destination: { list: task.list, folder: task.folder, space: task.space },
    labels: task.tags.map((tag) => {
      return tag.name;
    }),
    comments,
    attachments: Array.isArray(task.attachments) ? task.attachments : null,
    linked_resources: Array.isArray(task.linked_tasks) ? task.linked_tasks : null,
  };
}
