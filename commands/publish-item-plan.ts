import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

type Provider = 'linear' | 'clickup';
type Input = { item_id: string; plan_path: string };
type Run = (program: string, args: string[], input?: string) => string;
type Read = (path: string) => string;

const runCli: Run = (program, args, input) => execFileSync(program, args, {
  encoding: 'utf8', input, maxBuffer: 32 * 1024 * 1024,
});
const readPlan: Read = path => readFileSync(path, 'utf8');

function parseJson(output: string): unknown {
  const start = output.search(/^[\[{]/m);
  if (start < 0) throw new Error('Comment mutation returned no JSON result.');
  return JSON.parse(output.slice(start));
}

export function formatPlanComment(provider: Provider, content: string): string {
  const marker = 'Agent-Workflows-Approved-Plan:\n\n';
  if (provider === 'linear') return marker + content;
  const longest = Math.max(2, ...[...content.matchAll(/`+/g)].map(match => match[0].length));
  const fence = '`'.repeat(longest + 1);
  return `${marker}${fence}markdown\n${content}\n${fence}`;
}

export function publishItemPlan(provider: Provider, input: Input,
  run: Run = runCli, read: Read = readPlan) {
  if (!input.item_id?.trim() || !input.plan_path?.trim()) {
    throw new Error('Official item ID and approved plan path are required.');
  }
  const content = read(input.plan_path);
  if (!content.trim()) throw new Error('Approved plan file is empty.');
  const comment = formatPlanComment(provider, content);

  if (provider === 'linear') {
    const output = run('linear', ['issue', 'comment', 'add', input.item_id,
      '--body-file', '-', '--yes', '--no-input'], comment);
    const url = output.match(/https:\/\/\S+#comment-[\w-]+/)?.[0];
    if (!url || !/Added comment to issue/.test(output)) {
      throw new Error('Linear did not identify the created plan comment.');
    }
    return { status: 'published' as const, published: true, comment_url: url };
  }

  const response = parseJson(run('clickup-cli', ['comment', 'create', '--task',
    input.item_id, '--text', comment, '--output', 'json'])) as
    { id?: string; success?: boolean } | Array<{ id?: string; success?: boolean }>;
  const record = Array.isArray(response) ? response.length === 1 ? response[0] : null : response;
  if (!record?.id || record.success === false) {
    throw new Error('ClickUp did not identify the created plan comment.');
  }
  return { status: 'published' as const, published: true, comment_id: record.id };
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
    stage = 'publish_item_plan';
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    process.stdout.write(`${JSON.stringify(publishItemPlan(provider, input))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      published: false, reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
