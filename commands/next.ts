import { readFileSync, mkdtempSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import { selectNext, unresolvedStatuses, type Candidate, type StatusCategory } from './next-selection.ts';

const snapshotPrefix = 'agent-workflows-next-';

function providerFromConfig(path: string): string {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  const parents: Array<{ indent: number; key: string }> = [];
  for (const line of lines) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = /^(\s*)([\w-]+):(?:\s*(.*))?$/.exec(line);
    if (!match) continue;
    const indentation = match[1];
    const key = match[2];
    if (indentation === undefined || key === undefined) continue;
    const indent = indentation.length;
    while (parents.length && parents.at(-1)!.indent >= indent) parents.pop();
    const path = [...parents.map(parent => parent.key), key].join('.');
    if (path === 'mcp.item.provider') {
      const scalar = (match[3] ?? '').replace(/\s+#.*$/, '').trim();
      const provider = scalar.replace(/^(?:'([^']*)'|"([^"]*)")$/, (_value, single, double) => single ?? double);
      if (provider === 'clickup' || provider === 'linear') return provider;
      throw new Error('mcp.item.provider must be clickup or linear');
    }
    if (!match[3]?.trim()) parents.push({ indent, key });
  }
  throw new Error('mcp.item.provider is missing from agent-workflows.yaml');
}

function classificationsFromArgument(value: string, expected: string[]): Record<string, StatusCategory> {
  const categories = value.split(',');
  if (categories.length !== expected.length ||
      categories.some(category => !['waiting', 'review', 'other'].includes(category))) {
    throw new Error('Classify every reported status as waiting, review, or other');
  }
  return Object.fromEntries(expected.map((status, index) => [status, categories[index]])) as Record<string, StatusCategory>;
}

function readSnapshot(path: string): Candidate[] {
  const directory = realpathSync(dirname(path));
  if (!basename(directory).startsWith(snapshotPrefix) || dirname(directory) !== realpathSync(tmpdir()) ||
      basename(path) !== 'candidates.json') {
    throw new Error('Invalid next snapshot path');
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    const provider = providerFromConfig(resolve('agent-workflows.yaml'));
    const adapter: { fetchCandidates(): Candidate[] } = await import(`../providers/${provider}/select-next-item.ts`);
    const candidates = adapter.fetchCandidates();
    const statuses = unresolvedStatuses(candidates);
    if (statuses.length) {
      const directory = mkdtempSync(join(tmpdir(), snapshotPrefix));
      const snapshot = join(directory, 'candidates.json');
      writeFileSync(snapshot, JSON.stringify(candidates), { mode: 0o600 });
      console.log(JSON.stringify({ status: 'classify-statuses', statuses, snapshot }));
      return;
    }
    console.log(JSON.stringify(selectNext(candidates)));
    return;
  }
  const [mode, snapshot, categories] = args;
  if (args.length !== 3 || mode !== '--resume' || !snapshot || !categories) {
    throw new Error('Expected --resume <snapshot> <comma-separated-categories>');
  }
  const candidates = readSnapshot(snapshot);
  const classifications = classificationsFromArgument(categories, unresolvedStatuses(candidates));
  const result = selectNext(candidates, classifications);
  rmSync(dirname(snapshot), { recursive: true, force: true });
  console.log(JSON.stringify(result));
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`next: ${message}`);
  process.exitCode = 1;
});
