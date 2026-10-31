import { normalizeItemReference } from './read-item.ts';
import type { ItemProvider } from './read-item.ts';
import { searchItems } from './search-items.ts';

export function resolveExistingItem(provider: ItemProvider, reference = '', query = ''): string {
  if (reference.trim()) {
    return normalizeItemReference(provider, reference);
  }
  if (!query.trim()) {
    throw new Error('Supply an item reference or title query.');
  }
  const phrase = query.trim();
  let matches = searchItems(provider, phrase);
  if (!matches.length && provider === 'linear') {
    const formatted = phrase.replace(/(?<![\w`])\/[a-z][\w-]*/gi, (command) => `\`${command}\``);
    if (formatted !== phrase) matches = searchItems(provider, formatted);
  }
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
