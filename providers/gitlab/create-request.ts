import { execFileSync } from 'node:child_process';

type Repository = { host: string; path: string; url: string };
type Input = { repository: Repository; source_branch: string; target_branch: string; title: string };
type MergeRequest = {
  iid?: number;
  IID?: number;
  state: string;
  draft?: boolean;
  work_in_progress?: boolean;
  source_branch?: string;
  sourceBranch?: string;
  target_branch?: string;
  targetBranch?: string;
  title: string;
  description?: string;
  web_url?: string;
  webUrl?: string;
};

export function createRequest(input: Input) {
  const { repository, source_branch, target_branch, title } = input;
  const created = execFileSync('glab', [
    'mr', 'create', '--repo', repository.url,
    '--source-branch', source_branch, '--target-branch', target_branch,
    '--title', title, '--description', '', '--draft', '--yes',
  ], { encoding: 'utf8' }).trim();
  const urls = created.split(/\s+/).filter(value => /^https?:\/\//.test(value));
  if (urls.length !== 1) {
    throw new Error(`Created GitLab request could not be identified: ${created}`);
  }
  const url = new URL(urls[0]!);
  const expected = `/${repository.path}/-/merge_requests/`;
  if (url.host !== repository.host || !url.pathname.startsWith(expected)) {
    throw new Error(`Created GitLab request URL does not match repository: ${url}`);
  }
  const iid = Number(url.pathname.slice(expected.length));
  if (!Number.isSafeInteger(iid) || iid <= 0) {
    throw new Error(`Invalid GitLab merge IID: ${url}`);
  }
  try {
    const output = execFileSync('glab', [
      'mr', 'view', String(iid), '--repo', repository.url, '--output', 'json',
    ], { encoding: 'utf8' });
    const observed = JSON.parse(output) as MergeRequest;
    let state = observed.state;
    if (state === 'opened') {
      state = 'open';
    }
    const draft = observed.draft === true || observed.work_in_progress === true;
    const source = observed.source_branch ?? observed.sourceBranch;
    const target = observed.target_branch ?? observed.targetBranch;
    if (Number(observed.iid ?? observed.IID) !== iid || state !== 'open' || !draft ||
        source !== source_branch || target !== target_branch) {
      throw new Error('Created GitLab request could not be verified.');
    }
    return {
      request_id: iid,
      kind: 'merge_request',
      title: observed.title,
      state: 'open',
      draft: true,
      source_branch: source,
      target_branch: target,
      body: observed.description ?? '',
      url: observed.web_url ?? observed.webUrl ?? url.toString(),
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
    failure.request_id = iid;
    throw failure;
  }
}
