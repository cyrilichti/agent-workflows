import { normalizeExactName } from '../../commands/resolve-item-destination.ts';
import { field, json, records, type Destination, type RecordValue, type Run } from '../destination-cli.ts';

type Value = { team: string; project?: string };

function matchesLinearUrl(reference: string, id: string, names: string[], url: string,
  kind?: 'team' | 'project'): boolean {
  const parsed = new URL(reference);
  if (parsed.hostname !== 'linear.app') return false;
  if (url && reference.replace(/\/$/, '') === url.replace(/\/$/, '')) return true;
  const parts = parsed.pathname.split('/').filter(Boolean);
  const type = parts.findIndex(part => part === kind);
  const token = type >= 0 ? parts[type + 1] : undefined;
  return !!token && (token === id || names.some(name => normalizeExactName(name) === normalizeExactName(token)));
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

export function listDestinations(reference: string, run: Run): Destination<Value>[] {
  const teams = records(json(run, 'linear', ['team', 'list', '--limit', 'all', '--json', '--no-input']));
  const projects = records(json(run, 'linear', ['project', 'list', '--all-teams',
    '--limit', 'all', '--json', '--no-input']));
  const destinations: Destination<Value>[] = [];
  const isUrl = reference.includes('://');
  for (const team of teams) {
    if (team.archived === true || team.archivedAt) continue;
    const id = field(team, 'id');
    const name = field(team, 'name');
    const key = field(team, 'key');
    if (!id) continue;
    const nativeMatch = isUrl && matchesLinearUrl(reference, id, [name, key], field(team, 'url'), 'team');
    if (isUrl && !nativeMatch) continue;
    destinations.push({ id, name, exactAlias: key, nativeMatch,
      choices: () => [{ label: `${key || name} — ${name}`, value: { team: id } }] });
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
    if (!id) continue;
    const nativeMatch = isUrl && matchesLinearUrl(reference, id, [name, slug], url, 'project');
    if (isUrl && !nativeMatch) continue;
    destinations.push({ id, name, exactAlias: slug, nativeMatch, choices: () =>
      linearProjectTeams(run, id).flatMap(team => {
        const teamId = field(team, 'id');
        return teamId ? [{
          label: `${field(team, 'key') || field(team, 'name')} / ${name}`,
          value: { team: teamId, project: id },
        }] : [];
      }),
    });
  }
  return destinations;
}
