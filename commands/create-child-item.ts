import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';
import { saveItem } from './save-item.ts';

type ParentItem = {
  id: string;
  destination: {
    team?: { id: string };
    project?: { id: string } | null;
    list?: { id: string };
  };
};
type Input = { parent_item: ParentItem; child: { title: string; body: string } };
type Run = (program: string, args: string[], input?: string) => string;

export function createChildItem(provider: 'linear' | 'clickup', input: Input,
  run?: Run) {
  const parent = input.parent_item;
  if (!parent?.id?.trim() || !parent.destination || !input.child) {
    throw new Error('Official parent and confirmed child are required.');
  }
  if (provider === 'linear') {
    const team = parent.destination.team?.id;
    const project = parent.destination.project?.id;
    if (!team?.trim() || (parent.destination.project && !project?.trim())) {
      throw new Error('Official parent team and project are required.');
    }
    return saveItem(provider, { mode: 'create', title: input.child.title,
      body: input.child.body, parent_item_id: parent.id,
      destination: { team, ...(project ? { project } : {}) } }, run);
  }
  const list = parent.destination.list?.id;
  if (!list?.trim()) throw new Error('Official parent List is required.');
  return saveItem(provider, { mode: 'create', title: input.child.title,
    body: input.child.body, parent_item_id: parent.id, destination: list }, run);
}

if (import.meta.main) {
  let stage = 'resolve_item_provider';
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    process.chdir(root);
    const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
    if (provider !== 'linear' && provider !== 'clickup') {
      throw new Error('Configure item provider as linear or clickup.');
    }
    stage = 'create_child_item';
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    process.stdout.write(`${JSON.stringify(createChildItem(provider, input))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
