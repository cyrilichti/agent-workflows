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
  const urls = created.split(/\s+/).filter(value => /^https?:\/\//.test(value));
  if (urls.length !== 1) {
    throw new Error(`Created GitHub request could not be identified: ${created}`);
  }
  const url = new URL(urls[0]!);
  const expected = `/${repository.owner}/${repository.repo}/pull/`;
  if (url.host !== repository.host || !url.pathname.startsWith(expected)) {
    throw new Error(`Created GitHub request URL does not match repository: ${url}`);
  }
  const requestId = Number(url.pathname.slice(expected.length));
  if (!Number.isSafeInteger(requestId) || requestId <= 0) {
    throw new Error(`Invalid GitHub pull number: ${url}`);
  }
  try {
    const output = execFileSync('gh', [
      'api', '--hostname', repository.host,
      `repos/${repository.owner}/${repository.repo}/pulls/${requestId}`,
    ], { encoding: 'utf8' });
    const observed = JSON.parse(output) as Pull;
    if (observed.number !== requestId || observed.state !== 'open' || observed.draft !== true ||
        observed.head?.ref !== source_branch || observed.base?.ref !== target_branch) {
      throw new Error('Created GitHub request could not be verified.');
    }
    return {
      request_id: requestId,
      kind: 'pull_request',
      title: observed.title,
      state: 'open',
      draft: true,
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
