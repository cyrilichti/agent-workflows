import { readdirSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, join } from 'node:path';

type SearchResult =
  | { path: string }
  | { status: 'not found' | 'search incomplete' };

function configuredPaths(input: string): string[] {
  const paths: unknown = JSON.parse(input);
  if (!Array.isArray(paths) || !paths.every(path => typeof path === 'string' && isAbsolute(path))) {
    throw new Error('Configured project paths must be a JSON array of absolute paths.');
  }
  return paths;
}

function unavailable(error: unknown): boolean {
  return error instanceof Error && 'code' in error &&
    (error.code === 'ENOENT' || error.code === 'ENOTDIR');
}

function inspectRepository(path: string): { path?: string; incomplete: boolean } {
  try {
    if (!statSync(path).isDirectory()) return { incomplete: false };
    const canonical = realpathSync(path);
    const git = statSync(join(path, '.git'));
    return git.isFile() || git.isDirectory()
      ? { path: canonical, incomplete: false }
      : { incomplete: false };
  } catch (error) {
    return { incomplete: !unavailable(error) };
  }
}

function inspectConfigured(paths: string[]): { repositories: string[]; incomplete: boolean } {
  const repositories: string[] = [];
  let incomplete = false;
  for (const path of paths) {
    const result = inspectRepository(path);
    if (result.path) repositories.push(result.path);
    incomplete ||= result.incomplete;
  }
  return { repositories, incomplete };
}

function inspectParents(paths: string[]): { repositories: string[]; incomplete: boolean } {
  const repositories: string[] = [];
  let incomplete = false;
  for (const parent of new Set(paths.map(dirname))) {
    let children: string[];
    try {
      children = readdirSync(parent);
    } catch (error) {
      incomplete ||= !unavailable(error);
      continue;
    }
    for (const child of children) {
      const result = inspectRepository(join(parent, child));
      if (result.path) repositories.push(result.path);
      incomplete ||= result.incomplete;
    }
  }
  return { repositories, incomplete };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[\s.-]+/g, '-').replace(/^-+|-+$/g, '');
}

function matchingRepositories(paths: string[], list: string): string[] {
  const normalizedList = `-${normalize(list)}-`;
  const repositories = [...new Set(paths)].sort();
  const full = repositories.map(path => ({ path, name: normalize(basename(path)) }))
    .filter(entry => entry.name && normalizedList.includes(`-${entry.name}-`));
  if (full.length) {
    const longest = Math.max(...full.map(entry => entry.name.length));
    return full.filter(entry => entry.name.length === longest).map(entry => entry.path);
  }
  const family = repositories.map(path => {
    const parts = normalize(basename(path)).split('-');
    const prefixes = parts.slice(0, -1).map((_part, index) => parts.slice(0, index + 1).join('-'));
    const longest = prefixes.filter(prefix => normalizedList.includes(`-${prefix}-`))
      .reduce((length, prefix) => Math.max(length, prefix.length), 0);
    return { path, longest };
  }).filter(entry => entry.longest > 0);
  if (!family.length) return [];
  const longest = Math.max(...family.map(entry => entry.longest));
  return family.filter(entry => entry.longest === longest).map(entry => entry.path);
}

function chooseRepository(paths: string[]): string {
  const frontend = paths.filter(path => !/api|back/i.test(basename(path)));
  return (frontend.length ? frontend : paths)[0]!;
}

function result(paths: string[], list: string): SearchResult {
  const configured = inspectConfigured(paths);
  const first = matchingRepositories(configured.repositories, list);
  if (first.length) {
    if (configured.incomplete) return { status: 'search incomplete' };
    return { path: chooseRepository(first) };
  }
  const parents = inspectParents(paths);
  if (configured.incomplete || parents.incomplete) return { status: 'search incomplete' };
  const second = matchingRepositories(parents.repositories, list);
  if (!second.length) return { status: 'not found' };
  return { path: chooseRepository(second) };
}

const list = process.argv[2];
const paths = process.argv[3];
try {
  if (!list?.trim()) throw new Error('Missing list.');
  if (paths === undefined) throw new Error('Missing configured project paths.');
  process.stdout.write(`${JSON.stringify(result(configuredPaths(paths), list))}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
