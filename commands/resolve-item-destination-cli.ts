import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { runCli, type Destination, type Run } from '../providers/destination-cli.ts';
import * as clickup from '../providers/clickup/list-destinations.ts';
import * as linear from '../providers/linear/list-destinations.ts';
import { matchDestinationNames, resolveMatchedDestinations } from './resolve-item-destination.ts';
import { resolveItemProvider } from './resolve-item-provider.ts';

type Provider = 'linear' | 'clickup';
type Value = string | { team: string; project?: string };

export function resolveProviderDestination(provider: Provider, reference: string, run: Run = runCli) {
  const projectName = reference.trim();
  if (!projectName) return { status: 'needs_reference' as const, provider };
  const adapter = provider === 'linear' ? linear : clickup;
  const destinations: Destination<Value>[] = adapter.listDestinations(projectName, run);
  const candidates = matchDestinationNames(projectName, destinations).flatMap(({ destination, assessment }) =>
    destination.choices().map(choice => ({ ...choice, ...assessment })),
  );
  return { provider, ...resolveMatchedDestinations(candidates) };
}

if (import.meta.main) {
  let stage = 'resolve_item_provider';
  try {
    const parent = dirname(import.meta.dirname);
    const root = basename(parent) === '.agents' ? dirname(parent) : parent;
    const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
    if (provider !== 'linear' && provider !== 'clickup') {
      throw new Error('Configure item provider as linear or clickup.');
    }
    stage = 'resolve_destination';
    const input = JSON.parse(readFileSync(0, 'utf8')) as { reference?: string };
    const result = resolveProviderDestination(provider, input.reference || '');
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
