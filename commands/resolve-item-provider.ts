import { readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export function resolveItemProvider(configPath: string): string | undefined {
  const lines = readFileSync(configPath, 'utf8').split(/\r?\n/);
  const parents: Array<{ indent: number; key: string }> = [];

  for (const line of lines) {
    if (!line.trim() || line.trimStart().startsWith('#')) {
      continue;
    }
    const match = /^(\s*)([\w-]+):(?:\s*(.*))?$/.exec(line);
    if (!match) {
      continue;
    }
    const indent = match[1]!.length;
    const key = match[2]!;
    while (parents.length && parents.at(-1)!.indent >= indent) {
      parents.pop();
    }
    const path = [...parents.map(parent => parent.key), key].join('.');
    if (path === 'mcp.item.provider') {
      const scalar = (match[3] ?? '').replace(/\s+#.*$/, '').trim();
      return scalar.replace(/^(?:'([^']*)'|"([^"]*)")$/, (_value, single, double) => single ?? double);
    }
    if (!match[3]?.trim()) {
      parents.push({ indent, key });
    }
  }
  return undefined;
}

if (import.meta.main) {
  const parent = dirname(import.meta.dirname);
  const root = basename(parent) === '.agents' ? dirname(parent) : parent;
  try {
    const configPath = join(root, 'agent-workflows.yaml');
    if (!statSync(configPath, { throwIfNoEntry: false })?.isFile()) {
      throw new Error('Configure mcp.item.provider in agent-workflows.yaml.');
    }
    const provider = resolveItemProvider(configPath);
    if (!provider) throw new Error('Configure mcp.item.provider in agent-workflows.yaml.');
    if (provider !== 'clickup' && provider !== 'linear') {
      throw new Error(`Unsupported item provider: ${provider}. Supported values: clickup, linear.`);
    }
    if (!statSync(join(parent, 'providers', provider), { throwIfNoEntry: false })?.isDirectory()) {
      throw new Error(`Missing provider directory: ${provider}.`);
    }
    process.stdout.write(`${provider}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
