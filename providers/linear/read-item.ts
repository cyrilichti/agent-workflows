import { execFileSync } from 'node:child_process';
import type { ItemComment, WorkItem } from '../../commands/read-item.ts';

export function readItem(reference: string): Omit<WorkItem, 'request_backlinks'> {
  const context = JSON.parse(execFileSync('linear', [
    'api', '--variable', `id=${reference}`, '--no-input',
  ], {
    input: `query ReadItemContext($id: String!) {
  issue(id: $id) {
    id identifier
    state { id name type }
    team { id key name }
    project { id name url }
  }
}`, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
  })) as { data?: { issue?: { id: string; identifier: string;
    state?: { type?: string }; team: unknown; project: unknown } }; errors?: unknown[] };
  const issue = context.data?.issue;
  if (context.errors?.length || !issue) throw new Error('Cannot read official Linear issue context.');
  const view = JSON.parse(execFileSync('linear', [
    'issue', 'view', issue.identifier, '--json', '--no-input',
  ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })) as {
    title: string; description: string | null; url: string;
    labels?: { name: string }[]; comments?: ItemComment[];
  };
  if (!Array.isArray(view.labels) || !view.labels.every(label => typeof label.name === 'string') ||
      !Array.isArray(view.comments) || !view.comments.every(comment => typeof comment.body === 'string')) {
    throw new Error('Linear labels or complete comments are unavailable.');
  }
  return { id: issue.id, identifier: issue.identifier, title: view.title,
    description: view.description ?? '', url: view.url, status: issue.state,
    closed: issue.state?.type ? ['completed', 'canceled'].includes(issue.state.type) : null,
    destination: { team: issue.team, project: issue.project },
    labels: view.labels.map(label => label.name), comments: view.comments.map(({ id, body }) => ({ id, body })) };
}
