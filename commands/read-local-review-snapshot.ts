import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { resolveRequestForProject } from './resolve-request.ts';

type Comparison = { base_sha: string; head_sha: string; start_sha?: string };
type Request = {
  request_id: number;
  kind: 'pull_request' | 'merge_request';
  title: string;
  state: string;
  draft: boolean;
  source_branch: string;
  target_branch: string;
  head_sha: string;
  body: string;
  url: string;
  comparison?: Comparison;
  review_activity?: unknown;
};
type Git = (...args: string[]) => string;

function git(root: string, ...args: string[]): string {
  const result = spawnSync('git', args, {
    cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args[0]} failed.`);
  }
  return result.stdout;
}

function linesInPatch(patch: string): { old_lines: number[]; new_lines: number[] } {
  const old_lines: number[] = [];
  const new_lines: number[] = [];
  let oldLine = 0;
  let newLine = 0;
  let inHunk = false;
  for (const line of patch.split('\n')) {
    const header = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (header) {
      oldLine = Number(header[1]);
      newLine = Number(header[2]);
      inHunk = true;
      continue;
    }
    if (line.startsWith('diff --git ')) inHunk = false;
    if (!inHunk || line.startsWith('\\ No newline')) continue;
    if (line.startsWith('+') && !line.startsWith('+++')) {
      new_lines.push(newLine++);
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      old_lines.push(oldLine++);
    } else if (line.startsWith(' ')) {
      oldLine++;
      newLine++;
    }
  }
  return { old_lines, new_lines };
}

export function readLocalReviewSnapshot(root: string, request: Request,
  runGit: Git = (...args) => git(root, ...args)) {
  if (!request.comparison || !request.review_activity) {
    throw new Error('Complete provider review metadata is required.');
  }
  const comparison = request.comparison;
  if (!/^[0-9a-f]{40,64}$/i.test(comparison.base_sha) ||
      !/^[0-9a-f]{40,64}$/i.test(comparison.head_sha) ||
      comparison.head_sha !== request.head_sha) {
    throw new Error('Invalid review comparison SHAs.');
  }
  if (runGit('branch', '--show-current').trim() !== request.source_branch ||
      runGit('rev-parse', 'HEAD').trim() !== request.head_sha) {
    throw new Error('Local branch or HEAD differs from the request snapshot.');
  }
  runGit('cat-file', '-e', `${comparison.base_sha}^{commit}`);
  runGit('cat-file', '-e', `${comparison.head_sha}^{commit}`);
  let base = comparison.base_sha;
  if (request.kind === 'pull_request') {
    const bases = runGit('merge-base', '--all', base, comparison.head_sha).trim().split('\n');
    if (bases.length !== 1 || !/^[0-9a-f]{40,64}$/i.test(bases[0]!)) {
      throw new Error('GitHub request has no unique merge base.');
    }
    base = bases[0]!;
  } else {
    if (!comparison.start_sha || !/^[0-9a-f]{40,64}$/i.test(comparison.start_sha)) {
      throw new Error('GitLab diff start SHA is unavailable.');
    }
    runGit('cat-file', '-e', `${comparison.start_sha}^{commit}`);
    if (runGit('merge-base', comparison.start_sha, comparison.head_sha).trim() !== base) {
      throw new Error('GitLab diff base does not match local history.');
    }
  }
  const args = ['diff', '--no-ext-diff', '--no-color', '--find-renames'];
  const diff = runGit(...args, '--binary', '--unified=3', base, comparison.head_sha);
  const changed_files = runGit(...args, '--name-only', '-z', base, comparison.head_sha)
    .split('\0').filter(Boolean);
  const anchors: Record<string, { old_lines: number[]; new_lines: number[] }> = {};
  for (const path of changed_files) {
    const patch = runGit(...args, '--unified=0', base, comparison.head_sha, '--', path);
    const header = patch.split('\n').find(line => line.startsWith('+++ '));
    if (header === `+++ b/${path}` || header === '+++ /dev/null') {
      anchors[path] = linesInPatch(patch);
    }
  }
  if (!diff && changed_files.length) throw new Error('Local diff is incomplete.');
  if (runGit('rev-parse', 'HEAD').trim() !== request.head_sha) {
    throw new Error('Local HEAD changed during snapshot collection.');
  }
  return { ...request, comparison: { ...comparison, diff_base_sha: base },
    diff, changed_files, anchors };
}

if (import.meta.main) {
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    const input = JSON.parse(readFileSync(0, 'utf8')) as {
      request_id: number; branch: string;
    };
    if (!Number.isInteger(input.request_id) || !input.branch) {
      throw new Error('Exact request ID and source branch are required.');
    }
    const request = resolveRequestForProject(root, input.request_id, [], input.branch,
      'review_snapshot');
    if (request.draft) throw new Error('Request is a draft.');
    const review_snapshot = readLocalReviewSnapshot(root, request);
    process.stdout.write(`${JSON.stringify({ status: 'resolved', review_snapshot })}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage: 'read_review_snapshot',
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
