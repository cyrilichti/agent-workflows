import { execFileSync } from 'node:child_process';

type Repository = { host: string; owner: string; repo: string };
type Input = { repository: Repository; source_branch: string; target_branch: string; title: string };
type Pull = {
  number: number;
  state: string;
  draft: boolean;
  head: { ref: string };
  base: { ref: string };
  title: string;
  body: string | null;
  html_url?: string;
};

export function createRequest(input: Input) {
  const { repository, source_branch, target_branch, title } = input;
  const repo = `${repository.host}/${repository.owner}/${repository.repo}`;
  const created = execFileSync('gh', [
    'pr', 'create', '--repo', repo, '--head', source_branch,
    '--base', target_branch, '--title', title, '--body', '', '--draft',
  ], { encoding: 'utf8' }).trim();
  const createdUrl = created.match(/https?:\/\/\S+/)?.[0];
  if (!createdUrl) {
    throw new Error('gh did not return a pull request URL.');
  }
  const url = new URL(createdUrl);
  const requestId = Number(url.pathname.split('/').filter(Boolean).at(-1));
  try {
    const output = execFileSync('gh', [
      'api', '--hostname', repository.host,
      `repos/${repository.owner}/${repository.repo}/pulls/${requestId}`,
    ], { encoding: 'utf8' });
    const observed = JSON.parse(output) as Pull;
    return {
      request_id: observed.number,
      kind: 'pull_request',
      title: observed.title,
      state: observed.state,
      draft: observed.draft,
      source_branch: observed.head.ref,
      target_branch: observed.base.ref,
      body: observed.body ?? '',
      url: observed.html_url ?? url.toString(),
    };
  } catch (error) {
    let reason = String(error);
    if (error instanceof Error) {
      reason = error.message;
    }
    const failure = new Error(reason) as Error & {
      created_url: string;
      request_id: number;
    };
    failure.created_url = url.toString();
    failure.request_id = requestId;
    throw failure;
  }
}
