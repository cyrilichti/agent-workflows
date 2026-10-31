import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

type Input = { item_id: string; label: string };
type Run = (program: string, args: string[], input?: string) => string;
type Label = { id: string; name: string; team?: { id: string } | null };

const runCli: Run = (program, args, input) => execFileSync(program, args, {
  encoding: 'utf8', input,
});

function linearApi(run: Run, query: string, variables: Record<string, unknown>) {
  const output = run('linear', ['--no-input', 'api', '--variables-json',
    JSON.stringify(variables)], query);
  const result = JSON.parse(output) as { data?: Record<string, unknown>; errors?: unknown[] };
  if (!result.data || result.errors?.length) throw new Error('Linear API returned an error.');
  return result.data;
}

export function applyItemLabel(provider: 'linear' | 'clickup', input: Input,
  run: Run = runCli) {
  if (!input.item_id?.trim() || !input.label?.trim()) {
    throw new Error('Item ID and label are required.');
  }
  if (provider === 'clickup') {
    try {
      const output = run('clickup-cli', ['task', 'add-tag', input.item_id,
        input.label, '--output', 'json']);
      const response = JSON.parse(output) as { success?: boolean; message?: string };
      if (response.success !== true && !/success|added/i.test(response.message ?? '')) {
        throw new Error('ClickUp did not confirm the tag addition.');
      }
      return { status: 'applied' as const, applied: true };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return { status: 'failed' as const, applied: false,
        reason: /tag.*(?:not found|does not exist)|(?:missing|unknown) tag/i.test(detail)
          ? 'label_missing' as const : 'provider_failure' as const };
    }
  }

  const query = `query FindLabel($name: String!, $itemId: String!, $after: String) {
    issue(id: $itemId) { team { id } }
    issueLabels(filter: {name: {eq: $name}, isGroup: {eq: false}},
      first: 250, after: $after, includeArchived: false) {
      nodes { id name team { id } }
      pageInfo { hasNextPage endCursor }
    }
  }`;
  const matches: Label[] = [];
  let after: string | null = null;
  const seen = new Set<string>();
  let itemTeamId: string | undefined;
  for (;;) {
    const data = linearApi(run, query, { name: input.label, itemId: input.item_id, after });
    const teamId = (data.issue as { team?: { id?: string } } | undefined)?.team?.id;
    if (!teamId || (itemTeamId && itemTeamId !== teamId)) {
      throw new Error('Linear item team is unavailable or changed during label lookup.');
    }
    itemTeamId = teamId;
    const page = data.issueLabels as {
      nodes?: Label[]; pageInfo?: { hasNextPage: boolean; endCursor: string | null };
    } | undefined;
    if (!Array.isArray(page?.nodes) || !page.pageInfo) {
      throw new Error('Linear label lookup is incomplete.');
    }
    matches.push(...page.nodes.filter(label => label.name === input.label && !!label.id &&
      (!label.team || label.team.id === itemTeamId)));
    if (!page.pageInfo.hasNextPage) break;
    const cursor = page.pageInfo.endCursor;
    if (!cursor || seen.has(cursor)) throw new Error('Linear label lookup has an invalid cursor.');
    seen.add(cursor);
    after = cursor;
  }
  if (matches.length > 1) throw new Error('Linear label lookup is ambiguous.');
  if (!matches.length) {
    const data = linearApi(run, `mutation CreateLabel($name: String!) {
      issueLabelCreate(input: {name: $name}) {
        success
        issueLabel { id name }
      }
    }`, { name: input.label });
    const created = data.issueLabelCreate as { success?: boolean; issueLabel?: Label } | undefined;
    if (!created?.success || created.issueLabel?.name !== input.label ||
        !created.issueLabel.id) {
      throw new Error('Linear label creation was not confirmed.');
    }
  }
  run('linear', ['issue', 'update', input.item_id, '--add-label', input.label,
    '--no-input']);
  return { status: 'applied' as const, applied: true };
}

if (import.meta.main) {
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    process.chdir(root);
    const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
    if (provider !== 'linear' && provider !== 'clickup') {
      throw new Error('Configure item provider as linear or clickup.');
    }
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    const result = applyItemLabel(provider, input);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (!result.applied) process.exitCode = 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage: 'apply_label',
      applied: false, reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
