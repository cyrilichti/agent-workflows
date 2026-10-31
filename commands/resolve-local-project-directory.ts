import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join } from 'node:path';

type SearchResult =
  | { path: string }
  | { status: 'not found' | 'search incomplete' };

function parsePaths(input: string): string[] {
  const paths: unknown = JSON.parse(input);
  if (!Array.isArray(paths) || !paths.every(path => typeof path === 'string' && isAbsolute(path))) {
    throw new Error('Configured project paths must be a JSON array of absolute paths.');
  }
  return paths;
}

function configuredPaths(input?: string): string[] {
  if (input !== undefined) return parsePaths(input);
  if (process.env.AI_PROVIDER === 'openai-api') return [];
  const config = join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'config.toml');
  let content: string;
  try {
    content = readFileSync(config, 'utf8');
  } catch {
    return [];
  }
  const paths: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    const match = /^\s*\[projects\.(?:"((?:[^"\\]|\\.)*)"|'([^']*)')\]\s*(?:#.*)?$/.exec(line);
    if (!match) continue;
    try {
      const path = match[1] === undefined ? match[2]! : JSON.parse(`"${match[1]}"`);
      if (typeof path === 'string' && isAbsolute(path)) paths.push(path);
    } catch {
      // Skip an unavailable project entry and inspect the remaining paths.
    }
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

function referenceName(reference: string): string {
  let value = reference.trim();
  try {
    value = new URL(value).pathname;
  } catch {
    // A repository name or owner/name is also an explicit reference.
  }
  return normalize(basename(value.replace(/\/$/, '').replace(/\.git$/, '')));
}

async function chooseRepository(paths: string[], itemId: string): Promise<string> {
  if (paths.length === 1) return paths[0]!;
  const root = basename(dirname(import.meta.dirname)) === '.agents'
    ? dirname(dirname(import.meta.dirname)) : dirname(import.meta.dirname);
  const { resolveItemProvider } = await import('./resolve-item-provider.ts');
  const { readItem } = await import('./read-item.ts');
  const provider = resolveItemProvider(join(root, 'agent-workflows.yaml'));
  if (provider !== 'linear' && provider !== 'clickup') {
    throw new Error('Configure item provider as linear or clickup to resolve repository ties.');
  }
  const item = readItem(provider, itemId);
  const candidates = paths.map(path => ({ path, name: normalize(basename(path)) }));
  const content = [item.title, item.description, ...item.comments.map(comment => comment.body)]
    .join('\n');
  const references = [...content.matchAll(/^(?:Primary repository|Repository|Repo):\s*(\S+)/gim)]
    .map(match => referenceName(match[1]!));
  const explicit = candidates.filter(candidate => references.includes(candidate.name));
  if (explicit.length === 1) return explicit[0]!.path;
  const mentioned = candidates.filter(candidate => {
    const escaped = candidate.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'im').test(content);
  });
  if (mentioned.length === 1) return mentioned[0]!.path;
  const frontend = paths.filter(path => !/api|back/i.test(basename(path)));
  return (frontend.length ? frontend : paths)[0]!;
}

async function result(paths: string[], list: string, itemId: string): Promise<SearchResult> {
  const configured = inspectConfigured(paths);
  const first = matchingRepositories(configured.repositories, list);
  if (first.length) {
    if (configured.incomplete) return { status: 'search incomplete' };
    return { path: await chooseRepository(first, itemId) };
  }
  const parents = inspectParents(paths);
  if (configured.incomplete || parents.incomplete) return { status: 'search incomplete' };
  const second = matchingRepositories(parents.repositories, list);
  if (!second.length) return { status: 'not found' };
  return { path: await chooseRepository(second, itemId) };
}

const list = process.argv[2];
const itemId = process.argv[3];
const paths = process.argv[4];
try {
  if (!list?.trim()) throw new Error('Missing list.');
  if (!itemId?.trim()) throw new Error('Missing item ID.');
  process.stdout.write(`${JSON.stringify(await result(configuredPaths(paths), list, itemId))}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
