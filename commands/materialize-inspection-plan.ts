import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { checkPlan } from './update-request.ts';

type Input = { item_id: string; item_url: string; head_sha: string; plan_content: string };

function ignored(root: string, path: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '-q', path], { cwd: root });
    return true;
  } catch {
    return false;
  }
}

export function materializeInspectionPlan(root: string, input: Input,
  isIgnored = (path: string) => ignored(root, path)) {
  if (!/^[0-9a-f]{40,64}$/i.test(input.head_sha)) {
    throw new Error('Frozen head SHA is invalid.');
  }
  const ticket = /^\*\*Ticket\s*:\*\*\s*\[([^\]]+)\]\(([^)]+)\)\s*$/m.exec(input.plan_content);
  if (!ticket || ticket[1] !== input.item_id || ticket[2] !== input.item_url) {
    throw new Error('Request-body plan does not identify the official item.');
  }
  checkPlan(input.plan_content);
  const slug = input.item_id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (!slug) throw new Error('Item ID cannot form a plan path.');
  const directory = existsSync(join(root, '.agents/commands'))
    ? '.agents/plans' : 'plans';
  const base = `${directory}/inspection-${slug}-${input.head_sha.slice(0, 12)}`;
  for (let suffix = 1; suffix < 1000; suffix++) {
    const path = `${base}${suffix === 1 ? '' : `-${suffix}`}.plan.md`;
    if (!isIgnored(path)) throw new Error(`Plan path is not Git-ignored: ${path}.`);
    try {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), input.plan_content, { flag: 'wx' });
      return path;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (readFileSync(join(root, path), 'utf8') === input.plan_content) return path;
    }
  }
  throw new Error('No available ignored inspection plan path.');
}

if (import.meta.main) {
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    const plan = materializeInspectionPlan(root, input);
    process.stdout.write(`${JSON.stringify({ status: 'resolved', plan })}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage: 'materialize_plan',
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
