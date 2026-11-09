import { execFileSync } from 'node:child_process';
import { accessSync, chmodSync, constants, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ownerMarker, run, teardown, type Run, type SandboxContext, type SandboxResult } from './sandbox-teardown.ts';

export function recordOwnership(context: SandboxContext): void {
  writeFileSync(join(context.root, ownerMarker), JSON.stringify(context), { mode: 0o600 });
}

export interface CreationInput { item_id: string; project_directory: string; dependency_directories: string[]; is_docker_enabled: boolean }
export type Compose = Record<string, any>;
export interface RepositoryCompose { source: string; file?: string }

export function parseCreationInput(value: any): CreationInput {
  if (!value || typeof value.item_id !== 'string' || !value.item_id.trim() ||
      typeof value.project_directory !== 'string' || !isAbsolute(value.project_directory) ||
      !Array.isArray(value.dependency_directories) || value.dependency_directories.some((path: unknown) => typeof path !== 'string' || !isAbsolute(path)) ||
      typeof value.is_docker_enabled !== 'boolean') throw new Error('Require item_id, absolute project_directory, absolute dependency_directories, and boolean is_docker_enabled.');
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

function localBuildContext(service: any): string | undefined {
  const context = service.build?.context;
  return typeof context === 'string' && !/^(?:[a-z][a-z0-9+.-]*:|git@)/i.test(context) ? context : undefined;
}

export function composePaths(model: Compose): string[] {
  const paths: string[] = [];
  for (const service of Object.values<any>(model.services ?? {})) {
    const context = localBuildContext(service);
    if (context) {
      paths.push(context);
      if (service.build.dockerfile) paths.push(isAbsolute(service.build.dockerfile) ? service.build.dockerfile : join(context, service.build.dockerfile));
    }
    for (const volume of service.volumes ?? []) if (volume.type === 'bind') paths.push(volume.source);
    for (const entry of service.env_file ?? []) paths.push(typeof entry === 'string' ? entry : entry.path);
  }
  for (const group of [model.secrets, model.configs]) {
    for (const entry of Object.values<any>(group ?? {})) if (entry.file) paths.push(entry.file);
  }
  return paths;
}

export function validateRepositories(project: string, dependencies: string[], model: Compose = {}, composeDirectory = project): string[] {
  const main = repositoryAt(project);
  if (main !== realpathSync(project)) throw new Error('project_directory must be a repository root.');
  const repositories = [main];
  for (const dependency of dependencies) {
    let root: string;
    try { root = repositoryAt(dependency); }
    catch { throw new Error('dependency_directories must contain repository roots.'); }
    if (root !== realpathSync(dependency)) throw new Error('dependency_directories must contain repository roots.');
    if (repositories.includes(root)) throw new Error('Duplicate dependency repository.');
    repositories.push(root);
  }
  if (new Set(repositories.map(path => basename(path))).size !== repositories.length) throw new Error('Dependency repository names must be distinct for relative Compose paths.');
  for (const path of composePaths(model)) {
    const root = repositoryAt(resolve(composeDirectory, path));
    if (!repositories.includes(root)) throw new Error(`Compose path has an undeclared dependency repository: ${path}`);
  }
  return repositories;
}

export function preflight(input: CreationInput, execute: Run = run): { repositories: string[]; models: RepositoryCompose[] } {
  const directory = input.project_directory;
  const worktreeOnly = () => ({ repositories: validateRepositories(directory, []), models: [] });
  if (!input.is_docker_enabled) {
    return worktreeOnly();
  }
  const composeNames = ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml'];
  const mainCompose = composeNames.find(name => existsSync(join(directory, name)));
  if (!mainCompose && !process.env.COMPOSE_FILE) return worktreeOnly();
  const repositories = validateRepositories(directory, input.dependency_directories);
  const models: RepositoryCompose[] = [];
  for (const [index, source] of repositories.entries()) {
    const file = composeNames.find(name => existsSync(join(source, name)));
    if (!file && index > 0) continue;
    // Source: https://docs.docker.com/reference/cli/docker/compose/config/
    const args = ['compose', ...(file ? ['-f', file] : []), 'config', '--format', 'json'];
    const result = execute('docker', args, source);
    if (/variable.*(?:not set|unset)|required variable/i.test(result.stderr)) throw new Error(`Compose has missing variables in ${source}.`);
    const model: Compose = JSON.parse(result.stdout);
    if (!model || !model.services || !Object.keys(model.services).length) throw new Error(`Compose configuration has no services in ${source}.`);
    for (const service of Object.values<any>(model.services)) {
      if (Object.values(service.environment ?? {}).some(value => value === null)) throw new Error(`Compose service environment has unresolved variables in ${source}.`);
      if (service.network_mode === 'host' && service.ports?.length) throw new Error('Host networking cannot publish isolated sandbox ports.');
    }
    for (const group of [model.secrets, model.configs]) for (const entry of Object.values<any>(group ?? {})) {
      if (entry.external) throw new Error('External secrets/configs cannot be resolved in a fresh sandbox.');
      if (entry.file) accessSync(resolve(source, entry.file), constants.R_OK);
      if (entry.environment) throw new Error('Compose secret/config from host environment is unavailable in the sandbox.');
    }
    for (const entry of Object.values<any>(model.volumes ?? {})) {
      if (entry?.external) throw new Error('External volumes cannot be resolved in a fresh sandbox.');
    }
    validateRepositories(directory, input.dependency_directories, model, source);
    models.push({ source, ...(file ? { file } : {}) });
  }
  return { repositories, models };
}

function copyLocalChanges(source: string, worktree: string): void {
  const patch = execFileSync('git', ['-C', source, 'diff', '--binary', '--no-ext-diff', '--no-textconv', 'HEAD', '--'], { maxBuffer: 32 * 1024 * 1024 });
  if (patch.length) execFileSync('git', ['-C', worktree, 'apply', '--binary', '-'], { input: patch, stdio: ['pipe', 'pipe', 'pipe'] });
  const untracked = execFileSync('git', ['-C', source, 'ls-files', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' });
  const ignored = execFileSync('git', ['-C', source, 'ls-files', '--others', '--ignored', '--exclude-standard', '-z'], { encoding: 'utf8' });
  const files = [...new Set(`${untracked}${ignored}`.split('\0').filter(Boolean))];
  const directoryModes = new Map<string, number>();
  for (const file of files) {
    if (!inside(source, resolve(source, file)) || !inside(worktree, resolve(worktree, file))) throw new Error('Invalid local file path.');
    const parents: string[] = [];
    for (let parent = dirname(file); parent !== '.'; parent = dirname(parent)) parents.unshift(parent);
    for (const parent of parents) {
      const target = join(worktree, parent);
      if (lstatSync(join(source, parent)).isSymbolicLink() || (existsSync(target) && lstatSync(target).isSymbolicLink())) throw new Error('Local file path traverses a symlink.');
      mkdirSync(target, { recursive: true });
      directoryModes.set(target, statSync(join(source, parent)).mode & 0o777);
    }
    cpSync(join(source, file), join(worktree, file), { recursive: true, dereference: false, verbatimSymlinks: true, preserveTimestamps: true });
    if (!lstatSync(join(source, file)).isSymbolicLink()) chmodSync(join(worktree, file), statSync(join(source, file)).mode & 0o777);
  }
  // Apply descendants first, so restrictive parent modes cannot block copying
  // or mode restoration deeper in the tree.
  for (const [path, mode] of [...directoryModes].sort(([a], [b]) => b.length - a.length)) chmodSync(path, mode);
}

export function createSandbox(value: unknown, execute: Run = run, sandboxDirectory = join(homedir(), 'sandboxes')): SandboxResult {
  let stage = 'input';
  let context: SandboxContext | undefined;
  try {
    const input = parseCreationInput(value);
    stage = 'preflight';
    const { repositories, models } = preflight(input, execute);
    stage = 'worktrees';
    const id = `aw-${randomUUID()}`;
    mkdirSync(sandboxDirectory, { recursive: true, mode: 0o700 });
    if (lstatSync(sandboxDirectory).isSymbolicLink() || !lstatSync(sandboxDirectory).isDirectory()) throw new Error('Invalid sandbox directory.');
    context = { version: 1, id, item_id: input.item_id, root: realpathSync(mkdtempSync(join(sandboxDirectory, 'aw-sandbox-'))), repositories: [], docker: null, ports: [] };
    recordOwnership(context);
    for (const source of repositories) {
      const worktree = join(context.root, basename(source));
      context.repositories.push({ source, worktree });
      recordOwnership(context);
      git(source, 'worktree', 'add', '--detach', worktree, 'HEAD');
      copyLocalChanges(source, worktree);
    }
    if (models.length) {
      stage = 'docker';
      const startup = [...models].reverse().map((entry, index) => {
        const worktree = context!.repositories.find(repository => repository.source === entry.source)!.worktree;
        return { file: entry.file, worktree, project: `${id}-${index}`, source: entry.source };
      });
      context.docker = { name: id };
      recordOwnership(context);
      // Source: https://docs.docker.com/reference/cli/sbx/run/
      execute('sbx', ['run', '--detach', '--name', id, '--no-input', '--no-progress', 'shell', context.root]);
      for (const entry of startup) {
        const compose = ['docker', 'compose', ...(entry.file ? ['-f', entry.file] : []), '-p', entry.project];
        execute('sbx', ['exec', '--workdir', entry.worktree, id, ...compose, 'up', '--detach', '--wait', '--wait-timeout', '120']);
        // Source: https://docs.docker.com/reference/cli/docker/compose/ps/
        const output = execute('sbx', ['exec', '--workdir', entry.worktree, id, ...compose, 'ps', '--format', 'json']).stdout.trim();
        for (const line of output ? output.split('\n') : []) {
          const service = JSON.parse(line);
          for (const port of service.Publishers ?? []) {
            if (port.URL !== '0.0.0.0') continue;
            const target = Number(port.TargetPort);
            const sandbox = Number(port.PublishedPort);
            const protocol = port.Protocol;
            if (!Number.isInteger(target) || target < 1 || !Number.isInteger(sandbox) || sandbox < 1 || !['tcp', 'udp'].includes(protocol)) throw new Error('Invalid Compose port inventory.');
            if (!context.ports.some(existing => existing.sandbox === sandbox && existing.protocol === protocol)) {
              context.ports.push({ service: `${basename(entry.source)}/${service.Service}`, target, sandbox, host: 0, protocol });
            }
          }
        }
      }
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
      const cleanup = teardown({ sandbox_context: context }, execute);
      if (cleanup.status === 'failed') reason += ` Rollback incomplete: ${cleanup.reason}`;
    }
    return { status: 'failed', stage, reason, ...(context ? { sandbox_context: context } : {}) };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  let result: SandboxResult;
  try { result = createSandbox(JSON.parse(readFileSync(0, 'utf8'))); }
  catch { result = { status: 'failed', stage: 'input', reason: 'Expected one JSON object on stdin.' }; }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.status === 'failed') process.exitCode = 1;
}
