import { execFileSync } from 'node:child_process';
import { normalizeLinearPage, type Candidate } from './next-selection.ts';

const firstPageQuery = `query PlannedIssues {
  issues(filter: {labels: {name: {eq: "agent-planned"}}},
         includeArchived: false, first: 250) {
    nodes {
      id title url updatedAt
      state { name }
      project { name }
      labels(first: 10) {
        nodes { name }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}`;

const remainingLabelsQuery = `query NextIssueLabels($id: String!, $after: String!) {
  issue(id: $id) {
    labels(first: 100, after: $after) {
      nodes { name }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function queryLinear(query: string, variables?: Record<string, string>): unknown {
  const args = ['--no-input', 'api'];
  if (variables) args.push('--variables-json', JSON.stringify(variables));
  let output: string;
  try {
    output = execFileSync('linear', args, {
      input: query, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    throw new Error('Linear query failed');
  }
  try {
    return JSON.parse(output);
  } catch {
    throw new Error('Linear returned invalid JSON');
  }
}

function remainingLabels(id: string, firstCursor: string): string[] {
  const names: string[] = [];
  const cursors = new Set<string>();
  let cursor: string | null = firstCursor;
  while (cursor) {
    if (cursors.has(cursor)) throw new Error('Linear label cursor repeated');
    cursors.add(cursor);
    const response = object(queryLinear(remainingLabelsQuery, { id, after: cursor }));
    const labels = object(object(object(response?.data)?.issue)?.labels);
    const nodes = labels?.nodes;
    const pageInfo = object(labels?.pageInfo);
    if (!Array.isArray(nodes) || !nodes.every(label => typeof object(label)?.name === 'string') ||
        typeof pageInfo?.hasNextPage !== 'boolean') {
      throw new Error('Incomplete Linear label page');
    }
    names.push(...nodes.map(label => object(label)!.name as string));
    if (!pageInfo.hasNextPage) break;
    if (typeof pageInfo.endCursor !== 'string' || !pageInfo.endCursor) throw new Error('Incomplete Linear label cursor');
    cursor = pageInfo.endCursor;
  }
  return names;
}

export function fetchLinearCandidates(): Candidate[] {
  return normalizeLinearPage(queryLinear(firstPageQuery), remainingLabels);
}
