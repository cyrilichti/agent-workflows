import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveConfiguredProvider } from './resolve-item-provider.ts';
import { resolveVersionRepository } from './resolve-version-repository.ts';

type Input = {
  push_remote_url: string;
  source_branch: string;
  target_branch: string;
  plan_name: string;
  item_id?: string;
};

try {
  const parent = dirname(import.meta.dirname);
  let root = parent;
  if (basename(parent) === '.agents') {
    root = dirname(parent);
  }
  process.chdir(root);
  const data = JSON.parse(readFileSync(0, 'utf8')) as Input;
  const provider = resolveConfiguredProvider(join(root, 'agent-workflows.yaml'), 'version') as 'github' | 'gitlab';
  const remote = data.push_remote_url;
  const source = data.source_branch;
  const target = data.target_branch;
  const name = data.plan_name;
  let title = name;
  if (data.item_id) {
    title = `${data.item_id}: ${name}`;
  }
  const adapter = await import(`../providers/${provider}/create-request.ts`);
  const request = adapter.createRequest({
    repository: resolveVersionRepository(remote, provider),
    source_branch: source,
    target_branch: target,
    title,
  });
  process.stdout.write(`${JSON.stringify({ status: 'created', request })}\n`);
} catch (error) {
  const failure = error as Error & { created_url?: string; request_id?: number };
  let reason = String(error);
  if (error instanceof Error) {
    reason = error.message;
  }
  const output: Record<string, unknown> = {
    status: 'failed',
    stage: 'create_request',
    reason,
  };
  if (failure.created_url) {
    output.created_url = failure.created_url;
    output.request_id = failure.request_id;
  }
  process.stdout.write(`${JSON.stringify(output)}\n`);
  process.exitCode = 1;
}
