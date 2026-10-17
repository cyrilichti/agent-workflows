import { createHash } from 'node:crypto';
import type { TraceAttribute } from './types/trace.types.ts';

export function textLength(value: unknown): number {
  if (value === undefined || value === null) return 0;
  return (typeof value === 'string' ? value : JSON.stringify(value)).length;
}

export function commandName(command: unknown): string {
  if (typeof command !== 'string') return 'shell';
  const inner = /(?:^|\s)-lc\s+['"]?([^\s'"\\]+)/.exec(command)?.[1]
    ?? command.trim().split(/\s+/)[0];
  const name = inner?.split('/').pop();
  return /^[A-Za-z0-9._-]+$/.test(name ?? '') ? name! : 'shell';
}

export function spanId(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function unixNanoseconds(milliseconds: number): string {
  return String(BigInt(milliseconds) * 1_000_000n);
}

export function traceAttribute(key: string, value: unknown): TraceAttribute {
  return {
    key,
    value: { stringValue: typeof value === 'string' ? value : JSON.stringify(value) },
  };
}

export function traceArrayAttribute(key: string, values: string[]): TraceAttribute {
  return {
    key,
    value: { arrayValue: { values: values.map((value) => ({ stringValue: value })) } },
  };
}
