import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { SandboxContext, SandboxResult } from './sandbox-context.ts';
import { removeResources, validateContext } from './sandbox-lifecycle.ts';
import { run, type Run } from './sandbox-runtime.ts';

export function teardown(value: any, execute: Run = run): SandboxResult {
  let stage = 'input';
  let context: SandboxContext | undefined;
  try {
    context = validateContext(value?.sandbox_context);
    stage = 'teardown';
    removeResources(context, execute);
    return { status: 'completed', sandbox_context: context };
  } catch (error) {
    return { status: 'failed', stage, reason: error instanceof Error ? error.message : String(error),
      ...(context ? { sandbox_context: context } : {}) };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  let result: SandboxResult;
  try { result = teardown(JSON.parse(readFileSync(0, 'utf8'))); }
  catch { result = { status: 'failed', stage: 'input', reason: 'Expected one JSON object on stdin.' }; }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status === 'failed') process.exitCode = 1;
}
