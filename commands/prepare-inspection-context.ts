import { spawnSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';
import { resolveExistingItem } from './resolve-existing-item.ts';
import { readItem } from './read-item.ts';
import type { WorkItem } from './read-item.ts';
import { resolveRequestForProject } from './resolve-request.ts';

type Request = ReturnType<typeof resolveRequestForProject>;

function git(root: string, ...args: string[]): string {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args[0]} failed.`);
  }
  return result.stdout.trim();
}

function ticketReference(body: string): { id: string; url: string } | undefined {
  const match = /^\*\*Ticket\s*:\*\*\s*\[([^\]]+)\]\(([^)]+)\)\s*$/m.exec(body);
  return match ? { id: match[1]!, url: match[2]! } : undefined;
}

export function prepareInspectionContext(
  root: string,
  item: WorkItem,
  request: Request,
  requestedId?: number,
  runGit = (...args: string[]) => git(root, ...args),
) {
  if (item.closed !== false || !item.labels.includes('agent-planned')) {
    throw new Error(`Item ${item.identifier ?? item.id} must be open and labeled agent-planned.`);
  }
  if (!item.request_backlinks.includes(request.url) ||
      (requestedId !== undefined && request.request_id !== requestedId)) {
    throw new Error('Request is not the exact request linked from the item.');
  }
  if (request.state !== 'open' || request.draft) {
    throw new Error('Linked request must be open and non-draft.');
  }
  const ticket = ticketReference(request.body);
  if (!ticket || ticket.id !== (item.identifier ?? item.id) || ticket.url !== item.url) {
    throw new Error('Request description does not identify the official item.');
  }
  const branch = runGit('branch', '--show-current');
  if (branch !== request.source_branch) {
    throw new Error(`Current branch is ${branch}, expected ${request.source_branch}.`);
  }
  const head = runGit('rev-parse', 'HEAD');
  if (!request.head_sha || head !== request.head_sha) {
    throw new Error('Local HEAD does not match the linked request head SHA.');
  }
  return {
    item,
    branch,
    request,
    plan_content: request.body,
  };
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
    const args = process.argv.slice(2);
    const query = args[0] === '--query';
    const input = query ? args[1] : args[0];
    if (!input) throw new Error('Supply an item reference or title query.');
    const requestedId = args[query ? 2 : 1];
    const exactId = requestedId === undefined ? undefined : Number(requestedId);
    if (requestedId !== undefined && (!Number.isInteger(exactId) || exactId! <= 0)) {
      throw new Error('Request ID must be a positive integer.');
    }
    stage = 'resolve_item';
    const reference = query
      ? resolveExistingItem(provider, undefined, input)
      : resolveExistingItem(provider, input);
    stage = 'read_item';
    const item = readItem(provider, reference);
    stage = 'resolve_request';
    const request = resolveRequestForProject(root, undefined, item.request_backlinks, undefined);
    stage = 'prepare_context';
    const inspection_context = prepareInspectionContext(root, item, request, exactId);
    process.stdout.write(`${JSON.stringify({ status: 'resolved', inspection_context })}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({
      status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error),
    })}\n`);
    process.exitCode = 1;
  }
}
