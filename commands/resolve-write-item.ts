import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';
import { normalizeItemReference, readItem } from './read-item.ts';
import { searchItems } from './search-items.ts';
import type { ItemProvider } from './read-item.ts';

type Input = { reference?: string; query?: string };

export function resolveWriteItem(provider: ItemProvider, input: Input) {
  let reference = input.reference?.trim();
  if (!reference) {
    const phrase = input.query?.trim();
    if (!phrase) throw new Error('Supply an item ID, URL, or title query.');
    let matches = searchItems(provider, phrase);
    if (!matches.length && provider === 'linear') {
      const formatted = phrase.replace(/(?<![\w`])\/[a-z][\w-]*/gi,
        command => `\`${command}\``);
      if (formatted !== phrase) matches = searchItems(provider, formatted);
    }
    if (!matches.length) {
      return { status: 'not_found' as const };
    }
    if (matches.length > 1) {
      return { status: 'ambiguous' as const, candidates: matches.map(item => ({
        item_id: item.provider_id,
        title: item.title,
        status: item.status,
        destination: item.destination,
      })) };
    }
    reference = matches[0]!.provider_id;
  }
  const item = readItem(provider, normalizeItemReference(provider, reference));
  return { status: 'resolved' as const, provider, item };
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
    stage = 'resolve_item';
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    const result = resolveWriteItem(provider, input);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
