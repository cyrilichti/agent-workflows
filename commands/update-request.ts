import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import * as github from '../providers/github/update-request.ts';
import * as gitlab from '../providers/gitlab/update-request.ts';
import { requestRemoteForProject, resolveRequestForProject } from './resolve-request.ts';
import type { GitHubRepository, GitLabRepository } from './resolve-version-repository.ts';

type Request = ReturnType<typeof resolveRequestForProject>;
type Context = {
  plan: string;
  item: unknown;
  branch: string;
  request: { request_id: number };
  published_head_sha?: string;
  source_findings?: unknown[];
};

const parent = dirname(import.meta.dirname);
const root = basename(parent) === '.agents' ? dirname(parent) : parent;

function git(...args: string[]): string {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() ||
      `git exited with status ${result.status}.`);
  }
  return result.stdout.trim();
}

function checkPlan(content: string): void {
  const lines = content.split(/\r?\n/);
  const section = (heading: string): string[] => {
    const start = lines.findIndex(line => line === `## ${heading}`);
    if (start < 0) throw new Error(`Plan has no ## ${heading} section.`);
    const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
    return lines.slice(start + 1, end < 0 ? undefined : end);
  };
  const steps = section('Steps').filter(line => /^\d+\. /.test(line));
  if (!steps.some(line => /^\d+\. ✓ \S/.test(line)) ||
      !steps.every(line => /^\d+\. [✓⊘] \S/.test(line))) {
    throw new Error('Plan needs a completed todo and no pending or in-progress todos.');
  }
  const validation = section('Validation').filter(line => /^- /.test(line));
  if (!validation.length || !validation.every(line => /^- \[[xX]\] \S/.test(line))) {
    throw new Error('Every plan validation must be checked.');
  }
}

function repository(request: Request): GitHubRepository | GitLabRepository {
  const url = new URL(request.url);
  const path = url.pathname.split('/').filter(Boolean);
  if (request.kind === 'pull_request') {
    if (path.length !== 4 || path[2] !== 'pull' || Number(path[3]) !== request.request_id) {
      throw new Error('Invalid pull request identity.');
    }
    return { host: url.host, owner: path[0]!, repo: path[1]! };
  }
  const marker = '/-/merge_requests/';
  const index = url.pathname.indexOf(marker);
  if (index < 0 || Number(url.pathname.slice(index + marker.length)) !== request.request_id) {
    throw new Error('Invalid merge request identity.');
  }
  return { host: url.host, path: decodeURIComponent(url.pathname.slice(1, index)),
    url: request.url.slice(0, request.url.indexOf(marker)) };
}

function sameBody(left: string, right: string): boolean {
  return left.replace(/[\r\n]+$/, '') === right.replace(/[\r\n]+$/, '');
}

export function updateRequest(context: Context) {
  let stage = 'validate_context';
  let request: Request | undefined;
  try {
    if (!context || !context.plan || !context.item || !context.branch ||
      !Number.isInteger(context.request?.request_id)) {
      throw new Error('Complete delivery context is required.');
    }
    const local = relative(root, resolve(root, context.plan));
    if (isAbsolute(context.plan) || local === '..' || local.startsWith('../')) {
      throw new Error('Plan reference must be project-relative.');
    }
    stage = 'check_plan';
    const body = readFileSync(join(root, local), 'utf8');
    checkPlan(body);

    stage = 'check_branch';
    if (git('status', '--porcelain')) throw new Error('Worktree or index is not clean.');
    const branch = git('branch', '--show-current');
    if (branch !== context.branch) throw new Error(`Current branch is ${branch}, expected ${context.branch}.`);
    const head = git('rev-parse', 'HEAD');
    const readRequest = () => resolveRequestForProject(root, context.request.request_id, [], branch);

    stage = 'check_request';
    request = readRequest();
    if (!request.head_sha) throw new Error('Request head SHA is unavailable.');
    if (request.source_branch === request.target_branch) {
      throw new Error('Request source and target branches are identical.');
    }
    const publishedHead = context.published_head_sha;
    if (publishedHead !== undefined && publishedHead !== request.head_sha) {
      throw new Error(`Request head changed: expected ${publishedHead}, observed ${request.head_sha}.`);
    }

    if (git('status', '--porcelain') || git('rev-parse', 'HEAD') !== head ||
        git('branch', '--show-current') !== branch) {
      throw new Error('Branch changed during readiness checks.');
    }

    if (publishedHead === undefined && request.head_sha !== head) {
      stage = 'push';
      const remote = requestRemoteForProject(root);
      git('push', '--', remote, `${head}:refs/heads/${request.source_branch}`);
      stage = 'observe_push';
      request = readRequest();
      if (request.head_sha !== head) {
        throw new Error(`Request head after push is ${request.head_sha}, expected ${head}.`);
      }
    }

    const expectedHead = request.head_sha;
    const repo = repository(request);
    if (!sameBody(request.body, body)) {
      stage = 'replace_description';
      if (request.kind === 'pull_request') {
        github.replaceDescription(repo as GitHubRepository, request.request_id, body);
      } else {
        gitlab.replaceDescription(repo as GitLabRepository, request.request_id, body);
      }
    }

    const title = request.title.replace(/^Draft:\s*/, '');
    if (request.draft || title !== request.title) {
      stage = 'mark_ready';
      if (request.kind === 'pull_request') {
        github.markReady(repo as GitHubRepository, request.request_id,
          title === request.title ? undefined : title, request.draft);
      } else {
        gitlab.markReady(repo as GitLabRepository, request.request_id,
          title === request.title ? undefined : title);
      }
    }
    stage = 'observe_request';
    request = readRequest();
    if (request.head_sha !== expectedHead || request.draft || !sameBody(request.body, body)) {
      throw new Error('The request head, description, or ready state changed during promotion.');
    }
    const { published_head_sha: _publishedHead, ...deliveryContext } = context;
    return { status: 'promoted' as const,
      delivery_context: { ...deliveryContext, plan: local, request, branch } };
  } catch (error) {
    return { status: 'failed' as const, stage,
      reason: error instanceof Error ? error.message : String(error),
      ...(request ? { request } : {}) };
  }
}

if (import.meta.main) {
  let result: ReturnType<typeof updateRequest>;
  try {
    const context = JSON.parse(readFileSync(0, 'utf8')) as Context;
    result = updateRequest(context);
  } catch (error) {
    result = { status: 'failed', stage: 'validate_context',
      reason: error instanceof Error ? error.message : String(error) };
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status === 'failed') process.exitCode = 1;
}
