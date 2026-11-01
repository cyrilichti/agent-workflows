import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';
import { normalizeItemReference, readItem } from './read-item.ts';
import type { ItemProvider } from './read-item.ts';
import { searchItems } from './search-items.ts';
import type { ItemMatch } from './search-items.ts';

export function parseItemArguments(args: string[]): { reference: string; query: string } {
  if (args.length === 1 && args[0] !== '--query' && args[0]?.trim()) {
    return { reference: args[0], query: '' };
  }
  if (args.length === 2 && args[0] === '--query' && args[1]?.trim()) {
    return { reference: '', query: args[1] };
  }
  throw new Error('Supply an item ID or native URL, or --query with a title phrase.');
}

function findMatches(provider: ItemProvider, phrase: string): ItemMatch[] {
  let matches = searchItems(provider, phrase);
  if (!matches.length && provider === 'linear') {
    const formatted = phrase.replace(/(?<![\w`])\/[a-z][\w-]*/gi,
      command => `\`${command}\``);
    if (formatted !== phrase) matches = searchItems(provider, formatted);
  }
  return matches;
}

export function resolveExistingItem(provider: ItemProvider, reference = '', query = ''): string {
  if (reference.trim()) {
    return normalizeItemReference(provider, reference);
  }
  if (!query.trim()) {
    throw new Error('Supply an item reference or title query.');
  }
  const phrase = query.trim();
  const matches = findMatches(provider, phrase);
  if (!matches.length) {
    throw new Error(
      provider === 'clickup'
        ? 'No item matches on the first page of ClickUp search.'
        : 'No item matches the title query.',
    );
  }
  if (matches.length !== 1) {
    throw new Error(
      `Title query is ambiguous: ${matches
        .map((item) => {
          return `${item.provider_id} (${item.title})`;
        })
        .join(', ')}.`,
    );
  }
  return matches[0]!.provider_id;
}

export function resolveItemContext(provider: ItemProvider, reference = '', query = '',
  includeRelations = false) {
  let id = reference.trim();
  if (!id) {
    if (!query.trim()) throw new Error('Supply an item reference or title query.');
    const matches = findMatches(provider, query.trim());
    if (!matches.length) return { status: 'not_found' as const, provider };
    if (matches.length > 1) {
      return { status: 'ambiguous' as const, provider,
        candidates: matches.map(item => ({ item_id: item.provider_id,
          title: item.title, status: item.status, destination: item.destination })) };
    }
    id = matches[0]!.provider_id;
  }
  return { status: 'resolved' as const, provider,
    item: readItem(provider, normalizeItemReference(provider, id), includeRelations) };
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
    const args = process.argv.slice(2);
    const includeRelations = args[0] === '--with-relations';
    const { reference, query } = parseItemArguments(includeRelations ? args.slice(1) : args);
    const result = resolveItemContext(provider, reference, query, includeRelations);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
