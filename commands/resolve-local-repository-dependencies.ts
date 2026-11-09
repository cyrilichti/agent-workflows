import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join } from 'node:path';

type Match = { name: string; path: string } | { name: string; status: 'not found' | 'ambiguous' };

function configuredPaths(): string[] {
  const config = join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'config.toml');
  let content: string;
  try { content = readFileSync(config, 'utf8'); }
  catch { return []; }
  const paths: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    const match = /^\s*\[projects\.(?:"((?:[^"\\]|\\.)*)"|'([^']*)')\]\s*(?:#.*)?$/.exec(line);
    if (!match) continue;
    try {
      const path = match[1] === undefined ? match[2]! : JSON.parse(`"${match[1]}"`);
      if (typeof path === 'string' && isAbsolute(path)) paths.push(path);
    } catch {
      // Inspect the remaining configured projects.
    }
  }
  return paths;
}

function inspect(path: string): { path?: string; incomplete: boolean } {
  try {
    if (!statSync(path).isDirectory()) return { incomplete: false };
    const canonical = realpathSync(path);
    const git = statSync(join(path, '.git'));
    return git.isFile() || git.isDirectory()
      ? { path: canonical, incomplete: false }
      : { incomplete: false };
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined;
    return { incomplete: code !== 'ENOENT' && code !== 'ENOTDIR' };
  }
}

function inspectPaths(paths: string[]): { repositories: string[]; incomplete: boolean } {
  const repositories = new Set<string>();
  let incomplete = false;
  for (const path of paths) {
    const result = inspect(path);
    if (result.path) repositories.add(result.path);
    incomplete ||= result.incomplete;
  }
  return { repositories: [...repositories], incomplete };
}

function inspectNeighbors(paths: string[]): { repositories: string[]; incomplete: boolean } {
  const children: string[] = [];
  let incomplete = false;
  for (const parent of new Set(paths.map(dirname))) {
    try { children.push(...readdirSync(parent).map(name => join(parent, name))); }
    catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      incomplete ||= code !== 'ENOENT' && code !== 'ENOTDIR';
    }
  }
  const found = inspectPaths(children);
  return { repositories: found.repositories, incomplete: incomplete || found.incomplete };
}

function normalize(value: string): string {
  let name = value.trim();
  try { name = new URL(name).pathname; }
  catch { /* A repository name or owner/name is also valid. */ }
  return basename(name.replace(/\/$/, '').replace(/\.git$/, ''))
    .toLowerCase().replace(/[\s._-]+/g, '-').replace(/^-+|-+$/g, '');
}

function match(name: string, configured: string[], neighbors: string[]): Match {
  const normalized = normalize(name);
  const exact = (paths: string[]) => paths.filter(path => normalize(basename(path)) === normalized);
  const paths = exact(configured);
  const candidates = paths.length ? paths : exact(neighbors);
  if (!candidates.length) return { name, status: 'not found' };
  if (candidates.length > 1) return { name, status: 'ambiguous' };
  return { name, path: candidates[0]! };
}

function resolve(names: unknown): { results: Match[] } | { status: 'search incomplete' } {
  if (!Array.isArray(names) || !names.length || names.some(name => typeof name !== 'string' || !name.trim() || !normalize(name))) {
    throw new Error('Expected a nonempty JSON array of repository names.');
  }
  const paths = configuredPaths();
  const configured = inspectPaths(paths);
  const neighbors = inspectNeighbors(paths);
  if (configured.incomplete || neighbors.incomplete) return { status: 'search incomplete' };
  return { results: [...new Set(names as string[])].map(name => match(name, configured.repositories, neighbors.repositories)) };
}

try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--repository-names') {
    throw new Error('Pass --repository-names with one JSON array of repository names.');
  }
  process.stdout.write(`${JSON.stringify(resolve(JSON.parse(args[1]!)))}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
