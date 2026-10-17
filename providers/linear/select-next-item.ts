import { execFileSync } from 'node:child_process';

const categories: Record<string, 'waiting' | 'review'> = {
  open: 'waiting',
  backlog: 'waiting',
  todo: 'waiting',
  review: 'review',
  'in review': 'review',
};

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

function named(value: unknown): unknown {
  return object(value)?.name;
}

function labelPage(value: unknown): { names: string[]; nextCursor: string | null } {
  const labels = object(value);
  const nodes = labels?.nodes;
  const pageInfo = object(labels?.pageInfo);
  if (!Array.isArray(nodes) || !nodes.every(node => typeof named(node) === 'string') ||
      typeof pageInfo?.hasNextPage !== 'boolean') {
    throw new Error('Incomplete Linear labels');
  }
  const names = nodes.map(node => named(node) as string);
  if (!pageInfo.hasNextPage) return { names, nextCursor: null };
  if (typeof pageInfo.endCursor !== 'string' || !pageInfo.endCursor) throw new Error('Incomplete Linear label cursor');
  return { names, nextCursor: pageInfo.endCursor };
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
    const issue = object(object(response?.data)?.issue);
    const page = labelPage(issue?.labels);
    names.push(...page.names);
    cursor = page.nextCursor;
  }
  return names;
}

function normalizePage(page: unknown) {
  const issues = object(object(page)?.data)?.issues;
  const nodes = object(issues)?.nodes;
  if (!Array.isArray(nodes)) throw new Error('Linear did not return an issue page');
  return nodes.map((value, index) => {
    const issue = object(value);
    if (!issue) throw new Error(`Invalid Linear issue at index ${index}`);
    const labels = labelPage(issue.labels);
    const issueId = issue.id;
    const names = labels.names;
    if (labels.nextCursor) {
      if (typeof issueId !== 'string' || !issueId) throw new Error(`Missing Linear issue ID at index ${index}`);
      names.push(...remainingLabels(issueId, labels.nextCursor));
    }
    const updatedAt = issue.updatedAt;
    const timestamp = typeof updatedAt === 'string' && /(Z|[+-]\d{2}:\d{2})$/.test(updatedAt)
      ? Date.parse(updatedAt) : NaN;
    const rawStatus = object(issue.state)?.name;
    const status = typeof rawStatus === 'string' && rawStatus.trim() ? rawStatus.trim() : null;
    return {
      name: issue.title,
      id: issue.id,
      url: issue.url,
      list: named(issue.project),
      category: status ? categories[status.toLowerCase()] ?? null : null,
      labels: names,
      updatedAt: Number.isSafeInteger(timestamp) && timestamp >= 0 ? String(timestamp) : null,
    };
  });
}

export function fetchCandidates() {
  return normalizePage(queryLinear(firstPageQuery));
}
