import { execFileSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

export type ItemProvider = 'linear' | 'clickup';
export type Run = (program: string, args: string[], input?: string) => string;
const runCli: Run = (program, args, input) => execFileSync(program, args, {
  encoding: 'utf8', input, maxBuffer: 32 * 1024 * 1024,
});

function parseJson(output: string): unknown {
  const start = output.search(/^[\[{]/m);
  if (start < 0) throw new Error('Comment mutation returned no JSON result.');
  return JSON.parse(output.slice(start));
}

export function publishItemComment(provider: ItemProvider, itemId: string, comment: string, run: Run = runCli) {
  if (provider === 'linear') {
    const response = parseJson(run('linear', ['--no-input', 'api', '--variables-json',
      JSON.stringify({ itemId: itemId })],
    'query PlanItemReference($itemId: String!) { issue(id: $itemId) { identifier } }')) as
      { data?: { issue?: { identifier?: string } | null }; errors?: unknown[] };
    const identifier = response.data?.issue?.identifier;
    if (response.errors?.length || !identifier?.trim()) {
      throw new Error('Linear item identifier is unavailable.');
    }
    const output = run('linear', ['issue', 'comment', 'add', identifier,
      '--body-file', '-', '--yes', '--no-input'], comment);
    const url = output.match(/https:\/\/\S+#comment-[\w-]+/)?.[0];
    if (!url || !/Added comment to issue/.test(output)) {
      throw new Error('Linear did not identify the created comment.');
    }
    return { status: 'published' as const, published: true, comment_url: url };
  }

  const response = parseJson(run('clickup-cli', ['comment', 'create', '--task',
    itemId, '--text', comment, '--markdown', '--output', 'json'])) as
    { id?: string; success?: boolean } | Array<{ id?: string; success?: boolean }>;
  const record = Array.isArray(response) ? response.length === 1 ? response[0] : null : response;
  if (!record?.id || record.success === false) {
    throw new Error('ClickUp did not identify the created comment.');
  }
  return { status: 'published' as const, published: true, comment_id: record.id };
}

if (import.meta.main) {
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    process.chdir(root);
    const [itemId, comment] = process.argv.slice(2);
    if (!itemId?.trim()) {
      process.stdout.write(`${JSON.stringify({ status: 'skipped', reason: 'no_selected_item' })}\n`);
    } else {
      if (!comment?.trim()) throw new Error('A nonblank comment is required.');
      const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
      if (provider !== 'linear' && provider !== 'clickup') {
        throw new Error('Configure item provider as linear or clickup.');
      }
      process.stdout.write(`${JSON.stringify(publishItemComment(provider, itemId, comment))}\n`);
    }
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', published: false,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
