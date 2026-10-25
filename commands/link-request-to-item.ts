import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

type Input = {
  item_id: string;
  request_kind: 'pull_request' | 'merge_request';
  request_url: string;
  plan_reference: string;
};

try {
  const parent = dirname(import.meta.dirname);
  let root = parent;
  if (basename(parent) === '.agents') {
    root = dirname(parent);
  }
  process.chdir(root);
  const data = JSON.parse(readFileSync(0, 'utf8')) as Input;
  const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
  const itemId = data.item_id;
  const url = data.request_url;
  const plan = data.plan_reference;
  let prefix: string;
  if (data.request_kind === 'pull_request') {
    prefix = 'Draft PR';
  } else if (data.request_kind === 'merge_request') {
    prefix = 'Draft MR';
  } else {
    throw new Error('Unsupported request_kind.');
  }
  const comment = `${prefix}: ${url}\n\nAgent-Workflows-Plan: ${plan}`;
  const adapter = await import(`../providers/${provider}/add-request-backlink.ts`);
  const backlink = adapter.addBacklink(itemId, comment);
  process.stdout.write(`${JSON.stringify({ status: 'linked', backlink, comment })}\n`);
} catch (error) {
  let reason = String(error);
  if (error instanceof Error) {
    reason = error.message;
  }
  process.stdout.write(`${JSON.stringify({
    status: 'failed',
    stage: 'link_request_to_item',
    reason,
  })}\n`);
  process.exitCode = 1;
}
