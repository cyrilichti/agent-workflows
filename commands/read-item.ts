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
};

function requestBacklinks(comments: ItemComment[]): string[] {
  return [...new Set(comments.flatMap(comment =>
    [...comment.body.matchAll(/^Draft (?:PR|MR):\s*(https?:\/\/\S+)/gm)].map(match => match[1]!)))];
}

export function normalizeItemReference(provider: ItemProvider, reference: string): string {
  if (!reference.trim()) throw new Error('Supply an item reference.');
  if (!reference.includes('://')) return reference;
  const url = new URL(reference);
  const match = provider === 'linear'
    ? url.hostname === 'linear.app' && /\/issue\/([^/]+)(?:\/|$)/.exec(url.pathname)
    : (url.hostname === 'app.clickup.com' || url.hostname === 'clickup.com') && /^\/t\/([^/]+)\/?$/.exec(url.pathname);
  if (!match) throw new Error(`Invalid ${provider} item URL.`);
  return decodeURIComponent(match[1]!);
}

// The standalone work read needs core context, labels, complete comments and backlinks.
export function readItem(provider: ItemProvider, reference: string): WorkItem {
  const id = normalizeItemReference(provider, reference);
  const item = provider === 'linear' ? readLinearItem(id) : readClickUpItem(id);
  return { ...item, request_backlinks: requestBacklinks(item.comments) };
}
