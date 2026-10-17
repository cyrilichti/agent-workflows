import { readFileSync } from 'node:fs';

export function resolveItemProvider(configPath: string): 'clickup' | 'linear' {
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
      const provider = scalar.replace(/^(?:'([^']*)'|"([^"]*)")$/, (_value, single, double) => single ?? double);
      if (provider === 'clickup' || provider === 'linear') {
        return provider;
      }
      throw new Error('mcp.item.provider must be clickup or linear');
    }
    if (!match[3]?.trim()) {
      parents.push({ indent, key });
    }
  }
  throw new Error('mcp.item.provider is missing from agent-workflows.yaml');
}
