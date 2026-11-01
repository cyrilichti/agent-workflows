import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

type Destination = string | { team: string; project?: string };
type Input = {
  mode: 'create' | 'update';
  title: string;
  body: string;
  destination?: Destination;
  item_id?: string;
  parent_item_id?: string;
};
type Run = (program: string, args: string[], input?: string) => string;

const runCli: Run = (program, args, input) => execFileSync(program, args, {
  encoding: 'utf8', input, maxBuffer: 32 * 1024 * 1024,
});

function parseJson(output: string): unknown {
  const start = output.search(/^[\[{]/m);
  if (start < 0) throw new Error('Item mutation returned no JSON result.');
  return JSON.parse(output.slice(start));
}

export function saveItem(provider: 'linear' | 'clickup', input: Input, run: Run = runCli) {
  if (!input.title?.trim() || typeof input.body !== 'string') {
    throw new Error('Confirmed title and Markdown body are required.');
  }
  if (input.mode !== 'create' && input.mode !== 'update') {
    throw new Error('Mode must be create or update.');
  }
  let output: unknown;
  if (provider === 'linear') {
    const fields = 'success issue { id identifier title url state { name } }';
    if (input.mode === 'create') {
      const destination = input.destination;
      if (!destination || typeof destination === 'string' || !destination.team?.trim()) {
        throw new Error('A Linear team destination is required.');
      }
      const variables = { payload: { teamId: destination.team,
        ...(destination.project ? { projectId: destination.project } : {}),
        ...(input.parent_item_id ? { parentId: input.parent_item_id } : {}),
        title: input.title, description: input.body, useDefaultTemplate: false } };
      output = parseJson(run('linear', ['api', '--variables-json',
        JSON.stringify(variables), '--no-input'],
      `mutation CreateItem($payload: IssueCreateInput!) {
        issueCreate(input: $payload) { ${fields} }
      }`));
    } else {
      if (!input.item_id?.trim()) throw new Error('Existing item ID is required.');
      const variables = { id: input.item_id, payload: {
        title: input.title, description: input.body } };
      output = parseJson(run('linear', ['api', '--variables-json',
        JSON.stringify(variables), '--no-input'],
      `mutation UpdateItem($id: String!, $payload: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $payload) { ${fields} }
      }`));
    }
    const response = output as { data?: Record<string, { success?: boolean;
      issue?: Record<string, unknown> }>; errors?: unknown[] };
    const mutation = response.data?.[input.mode === 'create' ? 'issueCreate' : 'issueUpdate'];
    if (response.errors?.length || !mutation?.success || !mutation.issue) {
      throw new Error('Linear did not confirm the item mutation.');
    }
    output = mutation.issue;
  } else {
    const body = input.body.startsWith('@') ? `@${input.body}` : input.body;
    const title = input.title.startsWith('@') ? `@${input.title}` : input.title;
    if (input.mode === 'create') {
      const list = input.destination;
      if (typeof list !== 'string' || !list.trim()) {
        throw new Error('A ClickUp List destination is required.');
      }
      output = parseJson(run('clickup-cli', ['task', 'create', '--list', list,
        ...(input.parent_item_id ? ['--parent', input.parent_item_id] : []),
        '--name', title, '--description', body, '--output', 'json']));
    } else {
      if (!input.item_id?.trim()) throw new Error('Existing item ID is required.');
      output = parseJson(run('clickup-cli', ['task', 'update', input.item_id, '--name',
        title, '--description', body, '--output', 'json']));
    }
  }
  if (Array.isArray(output) && output.length !== 1) {
    throw new Error('Item mutation did not return exactly one item.');
  }
  const record = Array.isArray(output) ? output[0] : output;
  if (!record || typeof record !== 'object') {
    throw new Error('Item mutation returned no item.');
  }
  const value = record as Record<string, unknown>;
  const id = value.id ?? value.identifier ?? input.item_id;
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('Item mutation returned no item ID.');
  }
  return {
    status: 'saved' as const,
    item_id: id,
    item_reference: typeof value.identifier === 'string' ? value.identifier : id,
    title: typeof value.title === 'string' ? value.title :
      typeof value.name === 'string' ? value.name : input.title,
    url: typeof value.url === 'string' ? value.url : undefined,
    provider_status: typeof value.status === 'string' ? value.status :
      value.status && typeof value.status === 'object' &&
      typeof (value.status as Record<string, unknown>).status === 'string'
        ? (value.status as Record<string, unknown>).status :
        value.state && typeof value.state === 'object' &&
        typeof (value.state as Record<string, unknown>).name === 'string'
          ? (value.state as Record<string, unknown>).name : undefined,
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
    stage = 'save_item';
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    const result = saveItem(provider, input);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
