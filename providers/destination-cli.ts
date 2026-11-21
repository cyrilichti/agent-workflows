import { execFileSync } from 'node:child_process';
import type { DestinationName } from '../commands/resolve-item-destination.ts';

export type Run = (program: string, args: string[], input?: string) => string;
export type RecordValue = Record<string, unknown>;
export type Destination<Value> = DestinationName & {
  choices: () => { label: string; value: Value }[];
};

export const runCli: Run = (program, args, input) => execFileSync(program, args, {
  encoding: 'utf8', input, maxBuffer: 32 * 1024 * 1024,
});

export function json(run: Run, program: string, args: string[], input?: string): unknown {
  const output = run(program, args, input);
  const start = output.search(/^[\[{]/m);
  if (start < 0) throw new Error(`${program} returned no JSON result.`);
  return JSON.parse(output.slice(start));
}

export function records(value: unknown): RecordValue[] {
  if (Array.isArray(value)) return value.filter(entry => entry && typeof entry === 'object');
  if (!value || typeof value !== 'object') return [];
  const object = value as RecordValue;
  if (typeof object.id === 'string') return [object];
  if (Array.isArray(object.nodes)) return records(object.nodes);
  for (const key of ['data', 'teams', 'projects', 'spaces', 'folders', 'lists']) {
    if (object[key] !== undefined) {
      const nested = records(object[key]);
      if (nested.length || Array.isArray(object[key])) return nested;
    }
  }
  return [];
}

export function field(value: RecordValue, key: string): string {
  return typeof value[key] === 'string' ? value[key] as string : '';
}
