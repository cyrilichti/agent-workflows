import { basename, dirname, join } from 'node:path';
import { publishItemComment, type ItemProvider, type Run } from './publish-item-comment.ts';
import { resolveItemProvider } from './resolve-item-provider.ts';

export type WorkResult = {
  item_id: string;
  output: string;
  execution_id: string;
};
export const COMMENT_LIMIT = 8000;

function responseText(output: string): string {
  try {
    const response = JSON.parse(output) as { text?: unknown; error?: unknown; stdout?: unknown };
    if (typeof response?.text === 'string') return response.text;
    if (typeof response?.error === 'string') return response.error;
    if (typeof response?.stdout === 'string') return response.stdout;
  } catch {
    // Keep non-JSON diagnostics as received.
  }
  return output;
}

export function formatWorkResult(input: WorkResult): string {
  for (const field of ['item_id', 'execution_id'] as const) {
    if (typeof input[field] !== 'string' || !input[field].trim() || input[field].length > 256) {
      throw new Error(`A nonblank ${field} of at most 256 characters is required.`);
    }
  }
  if (typeof input.output !== 'string') {
    throw new Error('A string output is required.');
  }
  const header = `Work attempt result\nItem: ${input.item_id}\nKestra execution: ${input.execution_id}\n\n`;
  const text = Array.from(responseText(input.output).trim() || 'No textual response received.');
  const budget = COMMENT_LIMIT - Array.from(header).length;
  const notice = '\n\n[Output truncated; beginning and final diagnostic output retained.]\n\n';
  if (text.length <= budget) return header + text.join('');
  const available = budget - notice.length;
  const head = Math.floor(available / 3);
  return header + text.slice(0, head).join('') + notice + text.slice(-(available - head)).join('');
}

export function publishWorkResult(provider: ItemProvider, input: WorkResult, run?: Run) {
  const comment = formatWorkResult(input);
  return publishItemComment(provider, input.item_id, comment, run);
}

function scriptOutput(body: string): Record<string, unknown> | null {
  try {
    const response = JSON.parse(body) as { stdout?: unknown };
    const result = JSON.parse(response.stdout as string) as unknown;
    return result && typeof result === 'object' && !Array.isArray(result)
      ? result as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function publishAttemptResult(provider: ItemProvider, nextBody: string,
  projectBody: string, workBody: string, executionId: string, run?: Run) {
  const itemId = scriptOutput(nextBody)?.id;
  if (typeof itemId !== 'string' || !itemId.trim()) {
    return { status: 'skipped' as const, reason: 'no_selected_item' };
  }
  const project = scriptOutput(projectBody);
  const output = typeof project?.path === 'string' && project.path.trim()
    ? workBody || 'Work did not return a response. See the Kestra execution logs.'
    : projectBody || 'Project resolution did not return a response. See the Kestra execution logs.';
  return publishWorkResult(provider, { item_id: itemId, output, execution_id: executionId }, run);
}

if (import.meta.main) {
  let stage = 'resolve_item_provider';
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    process.chdir(root);
    const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
    if (provider !== 'linear' && provider !== 'clickup') {
      throw new Error('Configure item provider as linear or clickup.');
    }
    stage = 'publish_work_result';
    const [next_body, project_body, work_body, execution_id] = process.argv.slice(2);
    const result = publishAttemptResult(provider, next_body, project_body, work_body, execution_id);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage, published: false,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
