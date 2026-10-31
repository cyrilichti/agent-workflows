import type { ItemComment } from './read-item.ts';

export function inspectionRecord(requestUrl: string, headSha: string): string {
  if (!/^https:\/\//.test(requestUrl) || !/^[0-9a-f]{40,64}$/i.test(headSha)) {
    throw new Error('Exact request URL and head SHA are required.');
  }
  return `Agent-Workflows-Inspected: ${requestUrl} ${headSha}`;
}

export function hasInspectionRecord(comments: ItemComment[], requestUrl: string,
  headSha: string): boolean {
  const record = inspectionRecord(requestUrl, headSha);
  return comments.some(comment => comment.body.trim() === record);
}
