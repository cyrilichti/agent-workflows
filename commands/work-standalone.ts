import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';
import { readItem } from './read-item.ts';
import { resolveExistingItem } from './resolve-existing-item.ts';
import type { ItemProvider, WorkItem } from './read-item.ts';
import { readItemPlan } from './read-item-plan.ts';
import { establishPlanItemAssociation, planReferences } from './establish-plan-item-association.ts';
import { resolveWorkRequestForProject } from './resolve-work-request.ts';

function planPath(root: string, reference: string): string {
  const local = relative(root, resolve(root, reference));
  if (isAbsolute(reference) || local === '..' || local.startsWith('../')) {
    throw new Error('Plan reference must be project-relative.');
  }
  return local;
}

export async function prepareStandaloneWork(
  root: string, provider: ItemProvider, item: WorkItem,
  date = new Intl.DateTimeFormat('en-CA').format(new Date()),
  resolveRequest = (backlinks: string[]) => resolveWorkRequestForProject(root, undefined, backlinks, undefined),
) {
  if (item.closed !== false || !item.labels.includes('agent-planned')) {
    throw new Error(`Item ${item.identifier ?? item.id} must be open and labeled agent-planned.`);
  }
  const work_mode = item.request_backlinks.length ? 'resumed' : 'new';
  let reference: string;
  let content: string;
  let approved: string | undefined;
  if (work_mode === 'resumed') {
    const references = planReferences(item.comments.filter(comment => /^Draft (?:PR|MR):/m.test(comment.body)));
    if (!references.length) throw new Error('Missing plan reference in request backlink comment.');
    reference = planPath(root, references[0]!);
    content = readFileSync(join(root, reference), 'utf8');
  } else {
    content = approved = readItemPlan(provider, item.comments);
    const title = /^# (.+)$/m.exec(content)?.[1];
    if (!title) throw new Error('Approved plan has no title.');
    const slug = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/g, '');
    const directory = existsSync(join(root, '.agents/commands')) ? '.agents/plans' : 'plans';
    const base = `${directory}/${date}-${slug}`;
    reference = `${base}.plan.md`;
    for (let suffix = 2; existsSync(join(root, reference)); suffix++) reference = `${base}-${suffix}.plan.md`;
  }
  establishPlanItemAssociation(reference, content, item, approved);
  const request = work_mode === 'resumed' ? resolveRequest(item.request_backlinks) : undefined;
  if (work_mode === 'new') {
    mkdirSync(dirname(join(root, reference)), { recursive: true });
    writeFileSync(join(root, reference), content, { flag: 'wx' });
  }
  const delivery_context = { plan: reference, item,
    ...(request ? { request, branch: request.source_branch } : {}) };
  return { status: 'resolved', work_mode, delivery_context };
}

if (import.meta.main) {
  let stage = 'resolve_item_provider';
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
    if (provider !== 'linear' && provider !== 'clickup') throw new Error('Configure item provider as linear or clickup.');
    stage = 'resolve_item';
    const reference = resolveExistingItem(provider, process.argv[2], process.argv[3]);
    stage = 'read_item';
    const item = readItem(provider, reference);
    stage = 'prepare_context';
    const result = await prepareStandaloneWork(root, provider, item);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
