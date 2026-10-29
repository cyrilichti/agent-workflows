import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';
import { readItem } from './read-item.ts';
import { resolveExistingItem } from './resolve-existing-item.ts';
import type { ItemComment, ItemProvider, WorkItem } from './read-item.ts';
import { readItemPlan } from './read-item-plan.ts';
import { resolveRequestForProject } from './resolve-request.ts';

function extractPlanReferences(comments: ItemComment[]): string[] {
  const references: string[] = [];

  for (const comment of comments) {
    const matches = comment.body.matchAll(/^Agent-Workflows-Plan:\s*(.+)$/gm);
    for (const match of matches) {
      references.push(match[1]!.trim());
    }
  }

  return references;
}

function resolvePlanPath(root: string, reference: string): string {
  const local = relative(root, resolve(root, reference));
  if (isAbsolute(reference) || local === '..' || local.startsWith('../')) {
    throw new Error('Plan reference must be project-relative.');
  }
  return local;
}

function git(root: string, ...args: string[]): string {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args[0]} failed.`);
  }
  return result.stdout.trim();
}

function checkInspectionContext(item: WorkItem,
  request: ReturnType<typeof resolveRequestForProject>,
  readGit: (...args: string[]) => string): void {
  if (!item.request_backlinks.includes(request.url)) {
    throw new Error('Request is not linked from the official item.');
  }
  if (request.state !== 'open' || request.draft) {
    throw new Error('Linked request must be open and non-draft.');
  }
  const ticket = /^\*\*Ticket\s*:\*\*\s*\[([^\]]+)\]\(([^)]+)\)\s*$/m.exec(request.body);
  if (!ticket || ticket[1] !== (item.identifier ?? item.id) || ticket[2] !== item.url) {
    throw new Error('Request description does not identify the official item.');
  }
  const branch = readGit('branch', '--show-current');
  if (branch !== request.source_branch) {
    throw new Error(`Current branch is ${branch}, expected ${request.source_branch}.`);
  }
  if (readGit('rev-parse', 'HEAD') !== request.head_sha) {
    throw new Error('Local HEAD does not match the linked request head SHA.');
  }
}

export async function prepareDeliveryContext(
  root: string,
  provider: ItemProvider,
  item: WorkItem,
  date = new Intl.DateTimeFormat('en-CA').format(new Date()),
  resolveRequest = (backlinks: string[]) => {
    return resolveRequestForProject(root, undefined, backlinks, undefined);
  },
  requireLinkedRequest = false,
  inspection = false,
  readGit = (...args: string[]) => git(root, ...args),
) {
  if (item.closed !== false || !item.labels.includes('agent-planned')) {
    throw new Error(`Item ${item.identifier ?? item.id} must be open and labeled agent-planned.`);
  }
  const work_mode = item.request_backlinks.length ? 'resumed' : 'new';
  if ((requireLinkedRequest || inspection) && work_mode === 'new') {
    throw new Error('Item has no linked pull or merge request.');
  }
  let reference: string | undefined;
  let content: string | undefined;
  if (work_mode === 'resumed') {
    const backlinkComments = item.comments.filter((comment) => {
      return /^Draft (?:PR|MR):/m.test(comment.body);
    });
    const references = extractPlanReferences(backlinkComments);
    if (!references.length) {
      throw new Error('Missing plan reference in request backlink comment.');
    }
    reference = resolvePlanPath(root, references[0]!);
    content = readFileSync(join(root, reference), 'utf8');
  } else if (work_mode === 'new') {
    content = readItemPlan(provider, item.comments);
    const title = /^# (.+)$/m.exec(content)?.[1];
    if (!title) {
      throw new Error('Approved plan has no title.');
    }
    const slug = title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      .replace(/-+$/g, '');
    const directory = existsSync(join(root, '.agents/commands')) ? '.agents/plans' : 'plans';
    const base = `${directory}/${date}-${slug}`;
    reference = `${base}.plan.md`;
    for (let suffix = 2; existsSync(join(root, reference)); suffix++) {
      reference = `${base}-${suffix}.plan.md`;
    }
  }
  const request = work_mode === 'resumed' ? resolveRequest(item.request_backlinks) : undefined;
  if (inspection) {
    if (!request) throw new Error('Linked request is required for inspection.');
    checkInspectionContext(item, request, readGit);
  }
  if (work_mode === 'new') {
    if (!reference || content === undefined) throw new Error('Plan is unavailable.');
    mkdirSync(dirname(join(root, reference)), { recursive: true });
    writeFileSync(join(root, reference), content, { flag: 'wx' });
  }
  const delivery_context = {
    plan: reference!,
    item,
    ...(request ? { request, branch: request.source_branch } : {}),
  };
  return { status: 'resolved', work_mode, delivery_context };
}

if (import.meta.main) {
  let stage = 'resolve_item_provider';
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
    if (provider !== 'linear' && provider !== 'clickup') {
      throw new Error('Configure item provider as linear or clickup.');
    }
    stage = 'resolve_item';
    const args = process.argv.slice(2);
    const requireLinkedRequest = args[0] === '--require-linked-request';
    const inspection = args[0] === '--inspect';
    const [input, query] = requireLinkedRequest || inspection ? args.slice(1) : args;
    const reference =
      input === '--query'
        ? resolveExistingItem(provider, undefined, query)
        : resolveExistingItem(provider, input);
    stage = 'read_item';
    const item = readItem(provider, reference);
    stage = 'prepare_context';
    const result = await prepareDeliveryContext(root, provider, item,
      undefined, undefined, requireLinkedRequest, inspection);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify({
        status: 'failed',
        stage,
        reason: error instanceof Error ? error.message : String(error),
      })}\n`,
    );
    process.exitCode = 1;
  }
}
