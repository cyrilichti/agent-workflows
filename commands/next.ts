import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { selectNext, type Candidate } from './next-selection.ts';

function projectRoot(): string {
  const parent = dirname(import.meta.dirname);
  const root = basename(parent) === '.agents' ? dirname(parent) : parent;
  if (!existsSync(join(root, 'agent-workflows.yaml'))) {
    throw new Error('agent-workflows.yaml was not found');
  }
  return root;
}

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

async function main(): Promise<void> {
  if (process.argv.length !== 2) throw new Error('Unexpected next arguments');
  const root = projectRoot();
  const provider = providerFromConfig(join(root, 'agent-workflows.yaml'));
  process.chdir(root);
  const adapter: { fetchCandidates(): Candidate[] } = await import(`../providers/${provider}/select-next-item.ts`);
  console.log(JSON.stringify(selectNext(adapter.fetchCandidates())));
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`next: ${message}`);
  process.exitCode = 1;
});
