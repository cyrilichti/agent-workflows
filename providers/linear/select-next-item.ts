import { execFileSync } from 'node:child_process';

type Labels = {
  nodes: Array<{ name: string }>;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

type Issue = {
  id: string;
  title: string;
  url: string;
  updatedAt: string;
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

function queryLinear<T>(query: string, variables?: Record<string, string | null>): T {
  const args = ['--no-input', 'api'];
  if (variables) {
    args.push('--variables-json', JSON.stringify(variables));
  }
  const output = execFileSync('linear', args, {
    input: query, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
  });
  return JSON.parse(output) as T;
}

export function fetchCandidates() {
  const response = queryLinear<{ data: { issues: { nodes: Issue[] } } }>(firstPageQuery);
  return response.data.issues.nodes.map(issue => {
    let labels = issue.labels;
    const names = labels.nodes.map(label => label.name);
    while (labels.pageInfo.hasNextPage) {
      const page = queryLinear<{ data: { issue: { labels: Labels } } }>(remainingLabelsQuery, {
        id: issue.id,
        after: labels.pageInfo.endCursor,
      });
      labels = page.data.issue.labels;
      names.push(...labels.nodes.map(label => label.name));
    }
    const status = issue.state?.name?.trim().toLowerCase();
    return {
      name: issue.title,
      id: issue.id,
      url: issue.url,
      list: issue.project?.name ?? null,
      category: status ? categories[status] ?? null : null,
      labels: names,
      updatedAt: Date.parse(issue.updatedAt),
    };
  });
}
