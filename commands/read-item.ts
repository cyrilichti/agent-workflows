import { readItem as readLinearItem } from '../providers/linear/read-item.ts';
import { readItem as readClickUpItem } from '../providers/clickup/read-item.ts';

export type ItemProvider = 'linear' | 'clickup';
export type ItemComment = { id: string; body: string };
export type WorkItem = {
  id: string;
  identifier?: string;
  title: string;
  description: string;
  url: string;
  status: unknown;
  closed: boolean | null;
  destination: unknown;
  labels: string[];
  comments: ItemComment[];
  request_backlinks: string[];
  attachments?: unknown[] | null;
  linked_resources?: unknown[] | null;
};

function extractRequestBacklinks(comments: ItemComment[]): string[] {
  const backlinks = new Set<string>();

  for (const comment of comments) {
    const matches = comment.body.matchAll(/^Draft (?:PR|MR):\s*(https?:\/\/\S+)/gm);
    for (const match of matches) {
      backlinks.add(match[1]!);
    }
  }

  return [...backlinks];
}

export function normalizeItemReference(provider: ItemProvider, reference: string): string {
  if (!reference.trim()) {
    throw new Error('Supply an item reference.');
  }
  if (!reference.includes('://')) {
    return reference;
  }
  const url = new URL(reference);
  let match: RegExpExecArray | null = null;
  if (provider === 'linear' && url.hostname === 'linear.app') {
    match = /\/issue\/([^/]+)(?:\/|$)/.exec(url.pathname);
  } else if (
    provider === 'clickup' &&
    (url.hostname === 'app.clickup.com' || url.hostname === 'clickup.com')
  ) {
    match = /^\/t\/([^/]+)\/?$/.exec(url.pathname);
  }
  if (!match) {
    throw new Error(`Invalid ${provider} item URL.`);
  }
  return decodeURIComponent(match[1]!);
}

// The standalone work read needs core context, labels, complete comments and backlinks.
export function readItem(provider: ItemProvider, reference: string): WorkItem {
  const id = normalizeItemReference(provider, reference);
  const item = provider === 'linear' ? readLinearItem(id) : readClickUpItem(id);
  return { ...item, request_backlinks: extractRequestBacklinks(item.comments) };
}
