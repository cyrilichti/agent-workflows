import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { assertReadyPlan } from './ready-plan.ts';
import { resolveWorkRequestForProject } from './resolve-work-request.ts';
import { updateRequest } from './update-request.ts';

type Request = ReturnType<typeof resolveWorkRequestForProject>;
type Context = {
  plan: string;
  item: unknown;
  branch: string;
  request: { request_id: number };
  source_findings?: unknown[];
};

const parent = dirname(import.meta.dirname);
const root = basename(parent) === '.agents' ? dirname(parent) : parent;

function run(program: string, args: string[], input?: string): string {
  const result = spawnSync(program, args, { cwd: root, encoding: 'utf8', input });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() ||
      `${program} exited with status ${result.status}.`);
  }
  return result.stdout.trim();
}

function git(...args: string[]): string { return run('git', args); }
function equalBody(left: string, right: string): boolean {
  return left.replace(/[\r\n]+$/, '') === right.replace(/[\r\n]+$/, '');
}
function readExactRequest(context: Context): Request {
  const request = resolveWorkRequestForProject(root, context.request.request_id, [], context.branch);
  if (!request.head_sha) throw new Error('Request head SHA is unavailable.');
  return request;
}
export function promoteReady(context: Context) {
  let stage = 'validate_context';
  let observed: Request | undefined;
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
    assertReadyPlan(body);

    stage = 'check_branch';
    if (git('status', '--porcelain')) throw new Error('Worktree or index is not clean.');
    const branch = git('branch', '--show-current');
    if (branch !== context.branch) throw new Error(`Current branch is ${branch}, expected ${context.branch}.`);
    const head = git('rev-parse', 'HEAD');
    const counts = git('rev-list', '--left-right', '--count', 'HEAD...@{upstream}')
      .split(/\s+/).map(Number);
    const [ahead, behind] = counts;
    if (!Number.isInteger(ahead) || !Number.isInteger(behind) || behind !== 0) {
      throw new Error('Branch upstream is unavailable, behind, or diverged.');
    }

    stage = 'check_request';
    observed = readExactRequest(context);
    if (observed.source_branch === observed.target_branch) {
      throw new Error('Request source and target branches are identical.');
    }
    if (ahead === 0 && observed.head_sha !== head) {
      throw new Error('Request head does not match local HEAD.');
    }
    if (git('status', '--porcelain') || git('rev-parse', 'HEAD') !== head) {
      throw new Error('Branch changed during readiness checks.');
    }

    if (ahead! > 0) {
      stage = 'push';
      git('push');
    }
    stage = 'verify_head';
    observed = readExactRequest(context);
    if (observed.head_sha !== head) throw new Error('Request head does not match verified local HEAD.');

    if (!equalBody(observed.body, body)) {
      stage = 'replace_description';
      updateRequest({ request: observed, action: 'replace-description', body });
      observed = readExactRequest(context);
      if (!equalBody(observed.body, body) || observed.head_sha !== head) {
        throw new Error('Request description or head postcondition was not observed.');
      }
    }

    if (observed.draft || /^Draft:\s*/.test(observed.title)) {
      stage = 'mark_ready';
      updateRequest({ request: observed, action: 'mark-ready' });
      observed = readExactRequest(context);
    }
    stage = 'verify_ready';
    if (observed.state !== 'open' || observed.draft || /^Draft:\s*/.test(observed.title) ||
      observed.head_sha !== head || !equalBody(observed.body, body)) {
      throw new Error('Open, non-draft request at verified HEAD with the complete plan was not observed.');
    }
    return { status: 'promoted' as const,
      delivery_context: { ...context, plan: local, request: observed, branch } };
  } catch (error) {
    return { status: 'failed' as const, stage,
      reason: error instanceof Error ? error.message : String(error),
      ...(observed ? { request: observed } : {}) };
  }
}

if (import.meta.main) {
  let result: ReturnType<typeof promoteReady>;
  try {
    const context = JSON.parse(readFileSync(0, 'utf8')) as Context;
    result = promoteReady(context);
  } catch (error) {
    result = { status: 'failed', stage: 'validate_context',
      reason: error instanceof Error ? error.message : String(error) };
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status === 'failed') process.exitCode = 1;
}
