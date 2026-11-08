import { execFileSync } from 'node:child_process';
import { accessSync, chmodSync, constants, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolveRepositoryReference } from './resolve-local-project-directory.ts';
import type { SandboxContext, SandboxResult } from './sandbox-context.ts';
import { run, type Run } from './sandbox-runtime.ts';
import { recordOwnership, removeResources } from './sandbox-lifecycle.ts';

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

function copyIgnored(source: string, worktree: string): void {
  const files = execFileSync('git', ['-C', source, 'ls-files', '--others', '--ignored', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const file of files) {
    if (!inside(source, resolve(source, file)) || !inside(worktree, resolve(worktree, file))) throw new Error('Invalid ignored path.');
    const parents: string[] = [];
    for (let parent = dirname(file); parent !== '.'; parent = dirname(parent)) parents.unshift(parent);
    for (const parent of parents) {
      const target = join(worktree, parent);
      if (existsSync(target) && lstatSync(target).isSymbolicLink()) throw new Error('Ignored path traverses a symlink.');
      mkdirSync(target, { recursive: true });
      chmodSync(target, statSync(join(source, parent)).mode & 0o777);
    }
    cpSync(join(source, file), join(worktree, file), { recursive: true, dereference: false, verbatimSymlinks: true, preserveTimestamps: true });
    if (!lstatSync(join(source, file)).isSymbolicLink()) chmodSync(join(worktree, file), statSync(join(source, file)).mode & 0o777);
  }
}

function remapModel(model: Compose, context: SandboxContext): Compose {
  const result = structuredClone(model);
  const mapPath = (path: string): string => {
    const repository = [...context.repositories].sort((a, b) => b.source.length - a.source.length).find(entry => inside(entry.source, path));
    if (!repository) throw new Error('Compose path has no resolved repository.');
    return join(repository.worktree, relative(repository.source, path));
  };
  for (const [name, service] of Object.entries<any>(result.services)) {
    delete service.profiles;
    if (service.build?.context && isAbsolute(service.build.context)) service.build.context = mapPath(service.build.context);
    if (service.build?.dockerfile && isAbsolute(service.build.dockerfile)) service.build.dockerfile = mapPath(service.build.dockerfile);
    for (const volume of service.volumes ?? []) if (volume.type === 'bind') volume.source = mapPath(volume.source);
    for (let index = 0; index < (service.env_file ?? []).length; index++) {
      const entry = service.env_file[index];
      if (typeof entry === 'string') service.env_file[index] = mapPath(entry);
      else entry.path = mapPath(entry.path);
    }
    for (const port of service.ports ?? []) {
      const target = Number(port.target);
      const protocol = port.protocol ?? 'tcp';
      if (!Number.isInteger(target) || target < 1 || target > 65535 || !['tcp', 'udp'].includes(protocol)) throw new Error('Unsupported Compose port.');
      const sandbox = 20000 + context.ports.length;
      port.published = String(sandbox);
      port.host_ip = '0.0.0.0';
      context.ports.push({ service: name, target, sandbox, host: 0, protocol });
    }
  }
  for (const group of [result.secrets, result.configs]) for (const entry of Object.values<any>(group ?? {})) if (entry.file) entry.file = mapPath(entry.file);
  return result;
}

export function prepare(value: unknown, execute: Run = run): SandboxResult {
  let stage = 'input';
  let context: SandboxContext | undefined;
  try {
    const input = parsePreparationInput(value);
    stage = 'preflight';
    const { repositories, model } = preflight(input, execute);
    stage = 'worktrees';
    const id = `aw-${randomUUID()}`;
    context = { version: 1, id, item_id: input.item_id, root: realpathSync(mkdtempSync(join(tmpdir(), 'aw-sandbox-'))), repositories: [], docker: null, ports: [] };
    recordOwnership(context);
    for (const [index, source] of repositories.entries()) {
      const worktree = join(context.root, `${index}-${basename(source)}`);
      context.repositories.push({ source, worktree });
      recordOwnership(context);
      git(source, 'worktree', 'add', '--detach', worktree, 'HEAD');
      copyIgnored(source, worktree);
    }
    if (input.browser_validation && model) {
      stage = 'docker';
      const compose = join(context.root, 'compose.json');
      writeFileSync(compose, JSON.stringify(remapModel(model, context)), { mode: 0o600 });
      context.docker = { name: id };
      recordOwnership(context);
      // Source: https://docs.docker.com/reference/cli/sbx/create/
      execute('sbx', ['create', '--name', id, '--no-input', '--no-progress', 'shell', context.root]);
      execute('sbx', ['exec', '--workdir', context.repositories[0]!.worktree, id,
        'docker', 'compose', '-f', compose, '-p', id, 'up', '--detach', '--wait', '--wait-timeout', '120']);
      stage = 'ports';
      for (const port of context.ports) {
        // sbx allocates and holds the host binding atomically; no probe/release race.
        // Sources: https://docs.docker.com/reference/cli/sbx/ports/
        // https://docs.docker.com/ai/sandboxes/workflows/automation/#parse-command-output
        execute('sbx', ['ports', id, '--publish', `${port.sandbox}/${port.protocol}4`, '--no-input']);
      }
      if (context.ports.length) {
        const bindings = JSON.parse(execute('sbx', ['ports', id, '--format', 'json', '--no-input']).stdout);
        if (!Array.isArray(bindings)) throw new Error('Invalid port inventory.');
        for (const port of context.ports) {
          const binding = bindings.find(entry => Number(entry.sandbox_port) === port.sandbox && entry.protocol.replace(/4$/, '') === port.protocol);
          if (!binding || !Number.isInteger(Number(binding.host_port)) || Number(binding.host_port) < 1) throw new Error('Published host port unavailable.');
          port.host = Number(binding.host_port);
        }
      }
    }
    recordOwnership(context);
    return { status: 'prepared', sandbox_context: context };
  } catch (error) {
    let reason = error instanceof Error ? error.message : String(error);
    if (context) {
      try { removeResources(context, execute); }
      catch (cleanup) { reason += ` Rollback incomplete: ${cleanup instanceof Error ? cleanup.message : String(cleanup)}`; }
    }
    return { status: 'failed', stage, reason, ...(context ? { sandbox_context: context } : {}) };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  let result: SandboxResult;
  try { result = prepare(JSON.parse(readFileSync(0, 'utf8'))); }
  catch { result = { status: 'failed', stage: 'input', reason: 'Expected one JSON object on stdin.' }; }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status === 'failed') process.exitCode = 1;
}
