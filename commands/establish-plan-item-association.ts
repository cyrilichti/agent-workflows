import { normalize } from 'node:path';
import type { ItemComment, WorkItem } from './read-item.ts';

export function planReferences(comments: ItemComment[]): string[] {
  return comments.flatMap(comment => [...comment.body.matchAll(/^Agent-Workflows-Plan:\s*(.+)$/gm)]
    .map(match => match[1]!.trim()));
}

export function establishPlanItemAssociation(
  reference: string, content: string, item: WorkItem, approvedContent?: string,
): void {
  let associated = approvedContent !== undefined && content === approvedContent;
  for (const backlink of planReferences(item.comments)) {
    if (normalize(backlink) !== normalize(reference)) {
      throw new Error('Contradictory plan backlink for the selected item.');
    }
    associated = true;
  }
  for (const ticket of content.matchAll(/^\*\*Ticket\s*:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/gm)) {
    if (![item.id, item.identifier].includes(ticket[1]) || ticket[2] !== item.url) {
      throw new Error('Contradictory Ticket reference in the selected plan.');
    }
    associated = true;
  }
  if (!associated) throw new Error('No plan and item association is available.');
}
