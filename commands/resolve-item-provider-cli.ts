import { statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

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
