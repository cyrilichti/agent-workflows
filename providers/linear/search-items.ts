import { execFileSync } from 'node:child_process';
import type { ItemMatch } from '../../commands/search-items.ts';

export function searchItems(query: string): ItemMatch[] {
  const result = JSON.parse(execFileSync('linear', [
    'api', '--variable', `query=${query}`, '--no-input',
  ], {
    input: `query SearchItems($query: String!) {
  issues(filter: {title: {containsIgnoreCase: $query}},
         includeArchived: false, orderBy: updatedAt, first: 5) {
    nodes {
      id title
      state { name type }
      team { id name }
      project { id name }
    }
  }
}`, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
  })) as { errors?: unknown[]; data?: { issues?: { nodes: Array<{
    id: string; title: string; state?: { name: string }; team: unknown; project: unknown;
  }> } } };
  if (result.errors?.length || !result.data?.issues) throw new Error('Linear title search failed.');
  return result.data.issues.nodes.map(issue => ({ provider_id: issue.id, title: issue.title,
    status: issue.state?.name ?? null, destination: { team: issue.team, project: issue.project } }));
}
