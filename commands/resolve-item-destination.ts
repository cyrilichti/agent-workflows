import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { resolveItemProvider } from './resolve-item-provider.ts';

type Provider = 'linear' | 'clickup';
type Run = (program: string, args: string[], input?: string) => string;
type RecordValue = Record<string, unknown>;
type Candidate = {
  label: string;
  value: string | { team: string; project?: string };
  match: 'native_url' | 'exact_id' | 'normalized_exact_name' | 'strong_unique_approximate' | 'possible';
};

const runCli: Run = (program, args, input) => execFileSync(program, args, {
  encoding: 'utf8', input, maxBuffer: 32 * 1024 * 1024,
});

function json(run: Run, program: string, args: string[], input?: string): unknown {
  const output = run(program, args, input);
  const start = output.search(/^[\[{]/m);
  if (start < 0) throw new Error(`${program} returned no JSON result.`);
  return JSON.parse(output.slice(start));
}

function records(value: unknown): RecordValue[] {
  if (Array.isArray(value)) return value.filter(entry => entry && typeof entry === 'object');
  if (!value || typeof value !== 'object') return [];
  const object = value as RecordValue;
  if (typeof object.id === 'string') return [object];
  if (Array.isArray(object.nodes)) return records(object.nodes);
  for (const key of ['data', 'teams', 'projects', 'spaces', 'folders', 'lists']) {
    if (object[key] !== undefined) {
      const nested = records(object[key]);
      if (nested.length || Array.isArray(object[key])) return nested;
    }
  }
  return [];
}

function field(value: RecordValue, key: string): string {
  return typeof value[key] === 'string' ? value[key] as string : '';
}

function normalize(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[\s._/-]+/g, ' ').trim();
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_value, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let prior = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1,
        prior + Number(a[i - 1] !== b[j - 1]));
      prior = old;
    }
  }
  return row[b.length]!;
}

function classify(reference: string, id: string, names: string[], url = '',
  kind?: 'team' | 'project'):
  Candidate['match'] | undefined {
  if (reference.includes('://')) {
    const parsed = new URL(reference);
    if (parsed.hostname !== 'linear.app') return undefined;
    if (url && reference.replace(/\/$/, '') === url.replace(/\/$/, '')) {
      return 'native_url';
    }
    const parts = parsed.pathname.split('/').filter(Boolean);
    const type = parts.findIndex(part => part === kind);
    const token = type >= 0 ? parts[type + 1] : undefined;
    if (token && (token === id || names.some(name => normalize(name) === normalize(token)))) {
      return 'native_url';
    }
    return undefined;
  }
  if (reference === id) return 'exact_id';
  const query = normalize(reference);
  if (names.some(name => normalize(name) === query)) return 'normalized_exact_name';
  if (names.some(name => {
    const normalized = normalize(name);
    return normalized.includes(query) || query.includes(normalized) ||
      (query.length > 5 && distance(query, normalized) <= 2);
  })) return 'possible';
  return undefined;
}

function linearProjectTeams(run: Run, id: string): RecordValue[] {
  const teams: RecordValue[] = [];
  const seen = new Set<string>();
  let after: string | null = null;
  for (;;) {
    const result = json(run, 'linear', ['api', '--variables-json',
      JSON.stringify({ id, after }), '--no-input'],
    `query ProjectTeams($id: String!, $after: String) {
      project(id: $id) { teams(first: 50, after: $after) {
        nodes { id key name }
        pageInfo { hasNextPage endCursor }
      } }
    }`) as { data?: { project?: { teams?: { nodes?: RecordValue[];
      pageInfo?: { hasNextPage: boolean; endCursor: string | null } } } }; errors?: unknown[] };
    const page = result.data?.project?.teams;
    if (result.errors?.length || !Array.isArray(page?.nodes) || !page.pageInfo) {
      throw new Error('Linear project team list is incomplete.');
    }
    teams.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) return teams;
    const cursor = page.pageInfo.endCursor;
    if (!cursor || seen.has(cursor)) throw new Error('Linear project team pagination stopped.');
    seen.add(cursor);
    after = cursor;
  }
}

function linearCandidates(reference: string, run: Run): Candidate[] {
  const teams = records(json(run, 'linear', ['team', 'list', '--limit', 'all', '--json', '--no-input']));
  const projects = records(json(run, 'linear', ['project', 'list', '--all-teams',
    '--limit', 'all', '--json', '--no-input']));
  const candidates: Candidate[] = [];
  for (const team of teams) {
    if (team.archived === true || team.archivedAt) continue;
    const id = field(team, 'id');
    const name = field(team, 'name');
    const key = field(team, 'key');
    const match = classify(reference, id, [name, key], field(team, 'url'), 'team');
    if (id && match) candidates.push({ label: `${key || name} — ${name}`,
      value: { team: id }, match });
  }
  for (const project of projects) {
    const status = project.status as RecordValue | string | undefined;
    const statusName = typeof status === 'string' ? status :
      status && typeof status === 'object' ? field(status, 'type') || field(status, 'name') : '';
    if (project.archived === true || project.archivedAt ||
      /^(completed|canceled|cancelled)$/i.test(statusName)) continue;
    const id = field(project, 'id');
    const name = field(project, 'name');
    const url = field(project, 'url');
    const projectPath = url ? new URL(url).pathname.split('/').filter(Boolean) : [];
    const projectIndex = projectPath.indexOf('project');
    const slug = projectIndex >= 0 ? projectPath[projectIndex + 1] || '' : '';
    const match = classify(reference, id, [name, slug], url, 'project');
    if (!id || !match) continue;
    const projectTeams = linearProjectTeams(run, id);
    for (const team of projectTeams) {
      const teamId = field(team, 'id');
      if (!teamId) continue;
      candidates.push({ label: `${field(team, 'key') || field(team, 'name')} / ${name}`,
        value: { team: teamId, project: id }, match });
    }
  }
  return candidates;
}

function clickupCandidates(reference: string, run: Run): Candidate[] {
  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  const add = (list: RecordValue, path: string) => {
    const id = field(list, 'id');
    if (!id || list.archived === true || seen.has(id)) return;
    seen.add(id);
    const name = field(list, 'name');
    const match = classify(reference, id, [name, path], field(list, 'url'));
    if (match) candidates.push({ label: path, value: id, match });
  };
  if (/^(?:https?:\/\/)?(?:app\.)?clickup\.com\/t\//.test(reference)) {
    throw new Error('Supply a ClickUp List URL or ID, not a task URL.');
  }
  if (/^https?:\/\//.test(reference)) {
    const url = new URL(reference);
    if (url.hostname !== 'app.clickup.com' && url.hostname !== 'clickup.com') {
      throw new Error('Supply a native ClickUp List URL.');
    }
    const id = /\/v\/li\/([^/?#]+)/.exec(url.pathname)?.[1] ||
      /\/list\/([^/?#]+)/.exec(url.pathname)?.[1];
    if (!id) throw new Error('Cannot identify a ClickUp List in the URL.');
    const list = records(json(run, 'clickup-cli', ['list', 'get', id, '--output', 'json']))[0];
    if (!list || field(list, 'id') !== id || list.archived === true) {
      throw new Error('ClickUp List URL did not resolve to an active List.');
    }
    return [{ label: field(list, 'name') || id, value: id, match: 'native_url' }];
  }
  const spaces = records(json(run, 'clickup-cli', ['space', 'list', '--output', 'json']));
  for (const space of spaces) {
    if (space.archived === true) continue;
    const spaceId = field(space, 'id');
    const spaceName = field(space, 'name');
    if (!spaceId) continue;
    const folders = records(json(run, 'clickup-cli', ['folder', 'list', '--space',
      spaceId, '--output', 'json']));
    const folderIds = new Set(folders.map(folder => field(folder, 'id')));
    for (const folder of folders) {
      if (folder.archived === true) continue;
      const folderId = field(folder, 'id');
      if (!folderId) continue;
      const detail = records(json(run, 'clickup-cli', ['folder', 'get', folderId,
        '--output', 'json']))[0];
      if (!detail) throw new Error('ClickUp folder detail is unavailable.');
      if (detail.archived === true) continue;
      const folderName = field(detail, 'name') || field(folder, 'name');
      for (const list of records(detail.lists)) {
        add(list, `${spaceName} / ${folderName} / ${field(list, 'name')}`);
      }
    }
    for (const list of records(json(run, 'clickup-cli', ['list', 'list', '--space',
      spaceId, '--output', 'json']))) {
      const folder = list.folder as RecordValue | undefined;
      if (folder && folderIds.has(field(folder, 'id'))) continue;
      add(list, `${spaceName} / ${field(list, 'name')}`);
    }
  }
  return candidates;
}

export function resolveItemDestination(provider: Provider, reference: string,
  run: Run = runCli) {
  if (!reference?.trim()) return { status: 'needs_reference' as const, provider };
  const candidates = provider === 'linear'
    ? linearCandidates(reference.trim(), run) : clickupCandidates(reference.trim(), run);
  if (!candidates.length) return { status: 'not_found' as const, provider };
  const reliable = candidates.filter(candidate => candidate.match !== 'possible');
  if (reliable.length === 1) {
    return { status: 'resolved' as const, provider, destination: reliable[0]!.value };
  }
  if (reliable.length) return { status: 'ambiguous' as const, provider, candidates: reliable };
  const possible = candidates.filter(candidate => candidate.match === 'possible');
  if (possible.length === 1) {
    const name = normalize(possible[0]!.label.split(/\s+\/\s+|\s+—\s+/).at(-1) || '');
    const query = normalize(reference);
    const sameWords = name.split(' ').sort().join(' ') === query.split(' ').sort().join(' ');
    if (sameWords || (query.length > 5 && distance(name, query) <= 2)) {
      return { status: 'resolved' as const, provider,
        destination: possible[0]!.value,
        match: 'strong_unique_approximate' as const };
    }
  }
  return { status: 'ambiguous' as const, provider, candidates: possible };
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
    const result = resolveItemDestination(provider, input.reference || '');
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ status: 'failed', stage,
      reason: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}
