import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveConfiguredProvider } from './resolve-item-provider.ts';
import { readItem } from './read-item.ts';
import { hasInspectionRecord, inspectionRecord } from './inspection-record.ts';
import { addBacklink as addLinearComment } from '../providers/linear/add-request-backlink.ts';
import { addBacklink as addClickUpComment } from '../providers/clickup/add-request-backlink.ts';

type Input = { item_id: string; request_url: string; head_sha: string };

export function recordInspection(root: string, input: Input) {
  if (!input.item_id) throw new Error('Exact official item ID is required.');
  const record = inspectionRecord(input.request_url, input.head_sha);
  const provider = resolveConfiguredProvider(join(root, 'agent-workflows.yaml'), 'item');
  if (provider !== 'linear' && provider !== 'clickup') {
    throw new Error('Unsupported item provider.');
  }
  const item = readItem(provider, input.item_id);
  if (!hasInspectionRecord(item.comments, input.request_url, input.head_sha)) {
    if (provider === 'linear') addLinearComment(input.item_id, record);
    else addClickUpComment(input.item_id, record);
  }
  const observed = readItem(provider, input.item_id);
  if (!hasInspectionRecord(observed.comments, input.request_url, input.head_sha)) {
    throw new Error('The inspection record was not observed on the official item.');
  }
  return { status: 'recorded' as const, record };
}

if (import.meta.main) {
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    const input = JSON.parse(readFileSync(0, 'utf8')) as Input;
    process.stdout.write(`${JSON.stringify(recordInspection(root, input))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage: 'record_inspection',
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
