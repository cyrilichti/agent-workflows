import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { reconcileInspectionPublication } from './reconcile-inspection-publication.ts';
import type { Finding } from './reconcile-inspection-publication.ts';
import { resolveRequestForProject } from './resolve-request.ts';

type Input = {
  request_id: number;
  branch: string;
  head_sha: string;
  comparison: { base_sha: string; start_sha?: string; head_sha: string };
  review_activity: unknown;
  anchors: Record<string, { old_lines: number[]; new_lines: number[] }>;
  findings: Finding[];
  request_url: string;
};

function api(program: 'gh' | 'glab', host: string, path: string,
  payload: Record<string, unknown>): Record<string, unknown> {
  const output = execFileSync(program, [
    'api', '--hostname', host, '--method', 'POST', '--input', '-', path,
  ], { encoding: 'utf8', input: JSON.stringify(payload), maxBuffer: 50 * 1024 * 1024 });
  const result = JSON.parse(output) as Record<string, unknown>;
  if (!result || typeof result !== 'object') throw new Error('Review API returned no object.');
  return result;
}

function requestPath(url: string, id: number): { host: string; kind: 'github' | 'gitlab'; path: string } {
  const parsed = new URL(url);
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length === 4 && segments[2] === 'pull' && Number(segments[3]) === id) {
    return { host: parsed.host, kind: 'github',
      path: `repos/${segments[0]}/${segments[1]}/pulls/${id}/reviews` };
  }
  const marker = '/-/merge_requests/';
  const index = parsed.pathname.indexOf(marker);
  if (index > 0 && Number(parsed.pathname.slice(index + marker.length)) === id) {
    return { host: parsed.host, kind: 'gitlab',
      path: `projects/${encodeURIComponent(decodeURIComponent(parsed.pathname.slice(1, index)))}` +
        `/merge_requests/${id}/discussions` };
  }
  throw new Error('Invalid exact request URL.');
}

export function publishInspectionReview(root: string, input: Input,
  post = api,
  read = resolveRequestForProject) {
  if (!Number.isInteger(input.request_id) || !input.branch || !input.head_sha ||
      input.comparison.head_sha !== input.head_sha) {
    throw new Error('Complete frozen request identity is required.');
  }
  const current = read(root, input.request_id, [], input.branch, 'delivery_state');
  if (current.state !== 'open' || current.draft || current.head_sha !== input.head_sha ||
      current.url !== input.request_url) {
    return { status: 'stale' as const, published: [] as string[] };
  }
  const unseen = reconcileInspectionPublication(input.head_sha, input.findings,
    input.review_activity);
  for (const finding of unseen) {
    if (!finding.anchor) continue;
    const allowed = input.anchors[finding.anchor.path];
    const lines = finding.anchor.side === 'LEFT' ? allowed?.old_lines : allowed?.new_lines;
    if (!lines?.includes(finding.anchor.line)) {
      throw new Error(`Finding ${finding.id} has no valid local diff anchor.`);
    }
  }
  if (!unseen.length) {
    return { status: 'succeeded' as const, published: [] as string[],
      delivery_state: current };
  }
  const destination = requestPath(input.request_url, input.request_id);
  const published: string[] = [];
  if (destination.kind === 'github') {
    const comments = unseen.filter(finding => finding.anchor).map(finding => ({
      body: finding.body, path: finding.anchor!.path,
      line: finding.anchor!.line, side: finding.anchor!.side,
    }));
    const body = unseen.filter(finding => !finding.anchor).map(finding => finding.body)
      .join('\n\n');
    const response = post('gh', destination.host, destination.path,
      { commit_id: input.head_sha, event: 'COMMENT', body, comments });
    if (typeof response.id !== 'number' || response.state !== 'COMMENTED') {
      throw new Error('GitHub review publication was not observed.');
    }
    published.push(String(response.id));
  } else {
    if (!input.comparison.start_sha) throw new Error('GitLab diff start SHA is required.');
    for (const finding of unseen) {
      const anchor = finding.anchor;
      const position = anchor ? {
        position_type: 'text', base_sha: input.comparison.base_sha,
        start_sha: input.comparison.start_sha, head_sha: input.head_sha,
        old_path: anchor.path, new_path: anchor.path,
        ...(anchor.side === 'LEFT' ? { old_line: anchor.line } : { new_line: anchor.line }),
      } : undefined;
      const response = post('glab', destination.host, destination.path,
        { body: finding.body, ...(position ? { position } : {}) });
      const notes = response.notes;
      if (typeof response.id !== 'string' || !Array.isArray(notes) ||
          !notes.some(note => typeof note === 'object' && note !== null &&
            (note as { body?: unknown }).body === finding.body)) {
        throw new Error('GitLab discussion publication was not observed.');
      }
      published.push(response.id);
    }
  }
  const observed = read(root, input.request_id, [], input.branch, 'delivery_state');
  if (observed.head_sha !== input.head_sha) {
    return { status: 'stale' as const, published };
  }
  return { status: 'succeeded' as const, published, delivery_state: observed };
}

if (import.meta.main) {
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    process.stdout.write(`${JSON.stringify(publishInspectionReview(root, input))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed',
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
