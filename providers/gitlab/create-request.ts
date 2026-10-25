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
  const createdUrl = created.match(/https?:\/\/\S+/)?.[0];
  if (!createdUrl) {
    throw new Error('glab did not return a merge request URL.');
  }
  const url = new URL(createdUrl);
  const iid = Number(url.pathname.split('/').filter(Boolean).at(-1));
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
    return {
      request_id: Number(observed.iid ?? observed.IID),
      kind: 'merge_request',
      title: observed.title,
      state,
      draft,
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
