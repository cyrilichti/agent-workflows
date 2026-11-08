import { execFileSync } from 'node:child_process';
import { accessSync, constants, existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveRepositoryReference } from './resolve-local-project-directory.ts';
import type { SandboxResult } from './sandbox-context.ts';
import { run, type Run } from './sandbox-runtime.ts';

export interface PreparationInput { item_id: string; project_directory: string; browser_validation: boolean }
export type Compose = Record<string, any>;

export function parsePreparationInput(value: any): PreparationInput {
  if (!value || typeof value.item_id !== 'string' || !value.item_id.trim() ||
      typeof value.project_directory !== 'string' || !isAbsolute(value.project_directory) ||
      typeof value.browser_validation !== 'boolean') throw new Error('Require item_id, absolute project_directory, and boolean browser_validation.');
  return value;
}

export function git(directory: string, ...args: string[]): string {
  return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function inside(root: string, path: string): boolean {
  const part = relative(root, path);
  return part === '' || (!part.startsWith('..' + '/') && part !== '..' && !isAbsolute(part));
}

function repositoryAt(path: string): string {
  const directory = statSync(path).isDirectory() ? path : dirname(path);
  return realpathSync(git(directory, 'rev-parse', '--show-toplevel'));
}

export function composePaths(model: Compose): string[] {
  const paths: string[] = [];
  for (const service of Object.values<any>(model.services ?? {})) {
    if (service.build?.context && !/^(https?:|git@|service:)/.test(service.build.context)) paths.push(service.build.context);
    for (const volume of service.volumes ?? []) if (volume.type === 'bind') paths.push(volume.source);
    for (const entry of service.env_file ?? []) paths.push(typeof entry === 'string' ? entry : entry.path);
  }
  for (const group of [model.secrets, model.configs]) {
    for (const entry of Object.values<any>(group ?? {})) if (entry.file) paths.push(entry.file);
  }
  return paths;
}

export function resolveDependencies(project: string, model: Compose = {}): string[] {
  const main = repositoryAt(project);
  if (main !== realpathSync(project)) throw new Error('project_directory must be a repository root.');
  const repositories = [main];
  const add = (path: string) => { if (!repositories.includes(path)) repositories.push(path); };
  for (const path of composePaths(model)) add(repositoryAt(resolve(main, path)));
  for (let index = 0; index < repositories.length; index++) {
    const source = repositories[index]!;
    const readme = ['README.md', 'README', 'readme.md'].map(name => join(source, name)).find(existsSync);
    if (!readme) continue;
    const content = readFileSync(readme, 'utf8');
    const references = [...content.matchAll(/^\s*(?:[-*]\s*)?(?:Dependency|Repository|Repo):\s*`?([^`\s]+)`?/gim)].map(match => match[1]!);
    for (const match of content.matchAll(/\]\((\.\.?\/[^)#\s]+)(?:#[^)]*)?\)/g)) {
      const path = resolve(source, match[1]!);
      if (!inside(source, path)) references.push(path);
    }
    for (const reference of references) {
      const local = isAbsolute(reference) || reference.startsWith('.');
      add(local ? repositoryAt(resolve(source, reference)) : resolveRepositoryReference(reference, source));
    }
  }
  return repositories;
}

export function preflight(input: PreparationInput, execute: Run = run): { repositories: string[]; model: Compose | null } {
  // Source: https://docs.docker.com/ai/sandboxes/troubleshooting/
  execute('sbx', ['version', '--no-input']);
  const diagnostics = JSON.parse(execute('sbx', ['diagnose', '--format', 'json', '--no-input']).stdout);
  if (!Array.isArray(diagnostics.checks) || diagnostics.summary?.fail > 0 ||
      diagnostics.checks.some((check: any) => check.status === 'fail') ||
      !diagnostics.checks.some((check: any) => check.name === 'Authentication' && check.status === 'pass') ||
      !diagnostics.checks.some((check: any) => check.name === 'Daemon' && check.status === 'pass') ||
      !diagnostics.checks.some((check: any) => check.name === 'Virtualization' && check.status === 'pass')) {
    throw new Error('sbx authentication or local startup diagnostics failed. Run sbx diagnose.');
  }
  execute('docker', ['compose', 'version']);
  execute('docker', ['info', '--format', '{{json .ServerVersion}}']);
  const directory = input.project_directory;
  const hasCompose = !!process.env.COMPOSE_FILE || ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml']
    .some(name => existsSync(join(directory, name)));
  if (!hasCompose && input.browser_validation) throw new Error('Browser validation requires a Compose configuration.');
  let model: Compose | null = null;
  if (hasCompose) {
    // Source: https://docs.docker.com/reference/cli/docker/compose/config/
    const result = execute('docker', ['compose', '--profile', '*', 'config', '--format', 'json'], directory);
    if (/variable.*(?:not set|unset)|required variable/i.test(result.stderr)) throw new Error('Compose has missing variables.');
    model = JSON.parse(result.stdout);
    if (!model || !model.services || !Object.keys(model.services).length) throw new Error('Compose configuration has no services.');
    for (const service of Object.values<any>(model.services)) {
      if (Object.values(service.environment ?? {}).some(value => value === null)) throw new Error('Compose service environment has unresolved variables.');
      if (service.network_mode === 'host') throw new Error('Host networking cannot publish isolated browser ports.');
    }
    for (const group of [model.secrets, model.configs]) for (const entry of Object.values<any>(group ?? {})) {
      if (entry.external) throw new Error('External secrets/configs cannot be resolved in a fresh sandbox.');
      if (entry.file) accessSync(resolve(directory, entry.file), constants.R_OK);
      if (entry.environment && !process.env[entry.environment]) throw new Error('Compose secret/config environment is missing.');
    }
    for (const group of [model.volumes, model.networks]) for (const entry of Object.values<any>(group ?? {})) {
      if (entry?.external) throw new Error('External volumes/networks cannot be resolved in a fresh sandbox.');
    }
  }
  return { repositories: resolveDependencies(directory, model ?? {}), model };
}

export function prepare(value: unknown): SandboxResult {
  let stage = 'input';
  try {
    const input = parsePreparationInput(value);
    stage = 'preflight';
    preflight(input);
    throw new Error('Sandbox provisioning is not yet implemented.');
  } catch (error) {
    return { status: 'failed', stage, reason: error instanceof Error ? error.message : String(error) };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  let result: SandboxResult;
  try { result = prepare(JSON.parse(readFileSync(0, 'utf8'))); }
  catch { result = { status: 'failed', stage: 'input', reason: 'Expected one JSON object on stdin.' }; }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status === 'failed') process.exitCode = 1;
}
