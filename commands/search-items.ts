import type { ItemProvider } from './read-item.ts';
import { searchItems as searchLinearItems } from '../providers/linear/search-items.ts';
import { searchItems as searchClickUpItems } from '../providers/clickup/search-items.ts';

export type ItemMatch = { provider_id: string; title: string; status: string | null; destination: unknown };

export function searchItems(provider: ItemProvider, query: string): ItemMatch[] {
  return provider === 'linear' ? searchLinearItems(query) : searchClickUpItems(query);
}
