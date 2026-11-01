import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

type Input = { blocked_item_ref: string; blocking_item_refs: string[] };
type Run = (program: string, args: string[]) => string;

const runCli: Run = (program, args) => execFileSync(program, args, {
  encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
});

export function createBlockingRelations(provider: 'linear' | 'clickup', input: Input,
  run: Run = runCli) {
  if (!input.blocked_item_ref?.trim() || !Array.isArray(input.blocking_item_refs) ||
      !input.blocking_item_refs.length ||
      input.blocking_item_refs.some(ref => !ref?.trim() || ref === input.blocked_item_ref)) {
    throw new Error('Created child references are required for every blocking relation.');
  }
  const created: string[] = [];
  const failed: Array<{ blocking_item_ref: string; reason: string }> = [];
  for (const blocker of input.blocking_item_refs) {
    try {
      if (provider === 'linear') {
        run('linear', ['issue', 'relation', 'add', input.blocked_item_ref,
          'blocked-by', blocker, '--no-input']);
      } else {
        run('clickup-cli', ['task', 'add-dep', input.blocked_item_ref,
          '--depends-on', blocker, '--output', 'json']);
      }
      created.push(blocker);
    } catch (error) {
      failed.push({ blocking_item_ref: blocker,
        reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return { status: failed.length ? 'partially-failed' as const : 'created' as const,
    blocked_item_ref: input.blocked_item_ref, created, failed };
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
    stage = 'create_blocking_relations';
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    process.stdout.write(`${JSON.stringify(createBlockingRelations(provider, input))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
