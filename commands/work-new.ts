import { spawnSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';

type Input = {
  item_id: string;
  plan_name: string;
  plan_objective: string;
  plan_reference: string;
};

type Request = {
  kind: 'pull_request' | 'merge_request';
  url: string;
  [key: string]: unknown;
};

type CommandResult = {
  status: string;
  reason?: string;
  stage?: string;
  created_url?: string;
  request_id?: number;
  [key: string]: unknown;
};

type CommandError = Error & {
  stage?: string;
  created_url?: string;
  request_id?: number;
};

const parent = dirname(import.meta.dirname);
let root = parent;
if (basename(parent) === '.agents') {
  root = dirname(parent);
}
let stage = 'start_item';
const completed: Record<string, unknown> = {};

function run(program: string, args: string[]): string {
  const result = spawnSync(program, args, { cwd: root, encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() ||
      `${program} exited with status ${result.status}.`);
  }
  return result.stdout.trim();
}

function git(...args: string[]): string {
  return run('git', args);
}

function gitConfig(key: string): string | undefined {
  const result = spawnSync('git', ['config', '--get', key], { cwd: root, encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    return undefined;
  }
  return result.stdout.trim() || undefined;
}

function command(name: string, input: Record<string, unknown>): CommandResult {
  const result = spawnSync(process.execPath, [join(import.meta.dirname, name)], {
    cwd: root,
    encoding: 'utf8',
    input: JSON.stringify(input),
  });
  if (result.error) {
    throw result.error;
  }

  let output: CommandResult;
  try {
    output = JSON.parse(result.stdout) as CommandResult;
  } catch {
    throw new Error(result.stderr.trim() || `${name} returned no JSON result.`);
  }

  if (result.status !== 0 || output.status === 'failed') {
    const error = new Error(output.reason || result.stderr.trim() || `${name} failed.`) as CommandError;
    error.stage = output.stage || stage;
    if (output.created_url !== undefined) {
      error.created_url = output.created_url;
    }
    if (output.request_id !== undefined) {
      error.request_id = output.request_id;
    }
    throw error;
  }
  return output;
}

function branchName(input: Input): string {
  const objective = input.plan_objective.toLowerCase();
  const types: Array<[RegExp, string]> = [
    [/\b(feature|story)\b/, 'feature'],
    [/\b(bug|defect|fix)\b/, 'fix'],
    [/\b(refactor|refactoring)\b/, 'refactor'],
    [/\b(doc|docs|documentation)\b/, 'docs'],
    [/\b(test|tests)\b/, 'test'],
    [/\b(ci|continuous integration|continuous delivery)\b/, 'ci'],
    [/\b(build|dependenc(?:y|ies))\b/, 'build'],
    [/\b(chore|maintenance)\b/, 'chore'],
  ];
  let type = 'task';
  for (const [pattern, candidate] of types) {
    if (pattern.test(objective)) {
      type = candidate;
      break;
    }
  }

  const slug = input.plan_name.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '');
  return `${type}/${slug}`;
}

function parseInput(): Input {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args.some(value => !value.trim())) {
    throw new Error('Expected item ID, plan name, plan objective, and plan reference.');
  }
  const [item_id, plan_name, plan_objective, plan_reference] = args as [string, string, string, string];
  return { item_id, plan_name, plan_objective, plan_reference };
}

function pushRemote(): string {
  const current = git('branch', '--show-current');
  const branchRemote = gitConfig(`branch.${current}.pushRemote`);
  if (branchRemote) {
    return branchRemote;
  }
  const defaultPushRemote = gitConfig('remote.pushDefault');
  if (defaultPushRemote) {
    return defaultPushRemote;
  }
  const upstreamRemote = gitConfig(`branch.${current}.remote`);
  if (upstreamRemote) {
    return upstreamRemote;
  }
  const remotes = git('remote').split('\n').filter(Boolean);
  if (remotes.length !== 1) {
    throw new Error('Cannot identify the current push remote.');
  }
  return remotes[0]!;
}

function defaultBranch(remote: string): string {
  const head = git('ls-remote', '--symref', remote, 'HEAD');
  const branch = /^ref: refs\/heads\/([^\s]+)\s+HEAD/m.exec(head)?.[1];
  if (!branch) {
    throw new Error('Cannot identify the repository default branch.');
  }
  return branch;
}

try {
  const input = parseInput();
  const transition = command('transition-item-status.ts', { item_id: input.item_id });
  completed.resulting_status = transition.resulting_status;
  if (typeof transition.item_reference !== 'string' || !transition.item_reference.trim()) {
    throw new Error('Transition did not return an item CLI reference.');
  }
  const itemReference = transition.item_reference;

  stage = 'prepare_base';
  const remote = pushRemote();
  const pushRemoteUrl = git('remote', 'get-url', '--push', remote);
  completed.push_remote_url = pushRemoteUrl;
  const base = defaultBranch(remote);
  git('switch', base);
  git('pull', '--ff-only');
  if (git('status', '--porcelain')) {
    throw new Error('Worktree or index is not clean after updating the base branch.');
  }
  completed.target_branch = base;

  stage = 'create_branch';
  const branch = branchName(input);
  git('switch', '-c', branch);
  completed.branch = branch;
  git('commit', '--allow-empty', '-m', `Initialize ${input.plan_name}`);

  stage = 'push_branch';
  git('push', '--set-upstream', remote, branch);

  stage = 'create_request';
  const created = command('create-request.ts', {
    push_remote_url: pushRemoteUrl,
    source_branch: branch,
    target_branch: base,
    plan_name: input.plan_name,
    item_id: itemReference,
  });
  const request = created.request as Request;
  completed.request = request;

  stage = 'link_request_to_item';
  const linked = command('link-request-to-item.ts', {
    item_id: itemReference,
    request_kind: request.kind,
    request_url: request.url,
    plan_reference: input.plan_reference,
  });

  process.stdout.write(`${JSON.stringify({
    status: 'initialized',
    ...completed,
    backlink: linked.backlink,
  })}\n`);
} catch (error) {
  const failure = error as CommandError;
  let reason = String(error);
  if (error instanceof Error) {
    reason = error.message;
  }
  const output: Record<string, unknown> = {
    status: 'failed',
    stage: failure.stage || stage,
    reason,
    ...completed,
  };
  if (failure.created_url) {
    output.created_url = failure.created_url;
    output.request_id = failure.request_id;
  }
  process.stdout.write(`${JSON.stringify(output)}\n`);
  process.exitCode = 1;
}
