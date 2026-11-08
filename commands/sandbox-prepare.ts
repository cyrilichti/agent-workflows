import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveRepositoryReference } from './resolve-local-project-directory.ts';
import type { SandboxResult } from './sandbox-context.ts';

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

export function prepare(value: unknown): SandboxResult {
  let stage = 'input';
  try {
    const input = parsePreparationInput(value);
    stage = 'dependencies';
    resolveDependencies(input.project_directory);
    stage = 'preflight';
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
