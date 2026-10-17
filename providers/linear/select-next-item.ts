import { execFileSync } from 'node:child_process';

type Labels = {
  nodes: Array<{ name: string }>;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

type Issue = {
  id: string;
  title: string;
  url: string;
  updatedAt: unknown;
  state?: { name?: string };
  project: { name: string } | null;
  labels: Labels;
};

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

function queryLinear<T>(query: string, variables?: Record<string, string>): T {
  const args = ['--no-input', 'api'];
  if (variables) {
    args.push('--variables-json', JSON.stringify(variables));
  }
  let output: string;
  try {
    output = execFileSync('linear', args, {
      input: query, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    throw new Error('Linear query failed');
  }
  return JSON.parse(output) as T;
}

function remainingLabels(id: string, firstCursor: string): string[] {
  const names: string[] = [];
  let cursor: string | null = firstCursor;
  while (cursor) {
    const response: { data: { issue: { labels: Labels } } } = queryLinear(remainingLabelsQuery, { id, after: cursor });
    const labels: Labels = response.data.issue.labels;
    names.push(...labels.nodes.map(label => label.name));
    if (labels.pageInfo.hasNextPage && !labels.pageInfo.endCursor) {
      throw new Error('Incomplete Linear label cursor');
    }
    cursor = labels.pageInfo.hasNextPage ? labels.pageInfo.endCursor : null;
  }
  return names;
}

export function fetchCandidates() {
  const response = queryLinear<{ data: { issues: { nodes: Issue[] } } }>(firstPageQuery);
  return response.data.issues.nodes.map(issue => {
    const names = issue.labels.nodes.map(label => label.name);
    if (issue.labels.pageInfo.hasNextPage) {
      const cursor = issue.labels.pageInfo.endCursor;
      if (!cursor) {
        throw new Error('Incomplete Linear label cursor');
      }
      names.push(...remainingLabels(issue.id, cursor));
    }
    const updatedAt = issue.updatedAt;
    const timestamp = typeof updatedAt === 'string' && /(Z|[+-]\d{2}:\d{2})$/.test(updatedAt)
      ? Date.parse(updatedAt) : NaN;
    const status = issue.state?.name?.trim().toLowerCase();
    return {
      name: issue.title,
      id: issue.id,
      url: issue.url,
      list: issue.project?.name ?? null,
      category: status ? categories[status] ?? null : null,
      labels: names,
      updatedAt: Number.isSafeInteger(timestamp) && timestamp >= 0 ? String(timestamp) : null,
    };
  });
}
