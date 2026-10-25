import { execFileSync } from 'node:child_process';

type NativeStatus = { id: string; name: string; type?: string };
type Issue = { state: NativeStatus; team: { id: string; key?: string } };
export type ItemStatus = { id: string; name: string; category: 'active' | 'review' | 'completed' | 'other' };

function normalize(status: NativeStatus): ItemStatus {
  const type = status.type?.toLowerCase();
  let category: ItemStatus['category'] = 'other';
  if (type === 'completed') {
    category = 'completed';
  } else if (/\breview\b/i.test(status.name)) {
    category = 'review';
  } else if (type === 'started') {
    category = 'active';
  }
  return { id: status.id, name: status.name, category };
}

export function readStatuses(itemId: string, officialItem?: Record<string, unknown>): {
  current_status: ItemStatus; available_statuses: ItemStatus[];
} {
  const suppliedState = officialItem?.state as NativeStatus | undefined;
  const suppliedTeam = officialItem?.team as Issue['team'] | undefined;
  let issue: Issue;
  if (suppliedState && suppliedTeam) {
    issue = { state: suppliedState, team: suppliedTeam };
  } else {
    const output = execFileSync('linear', [
      '--no-input', 'api', '--variables-json', JSON.stringify({ id: itemId }),
    ], {
      input: 'query CurrentStatus($id: String!) { issue(id: $id) { state { id name type } team { id key } } }',
      encoding: 'utf8',
    });
    issue = (JSON.parse(output) as { data: { issue: Issue } }).data.issue;
  }
  const team = issue.team.key ?? issue.team.id;
  const statesOutput = execFileSync('linear', [
    'team', 'states', team, '--limit', 'all', '--json', '--no-input',
  ], { encoding: 'utf8' });
  const response = JSON.parse(statesOutput) as NativeStatus[] | { states: NativeStatus[] };
  let states: NativeStatus[];
  if (Array.isArray(response)) {
    states = response;
  } else {
    states = response.states;
  }
  return { current_status: normalize(issue.state), available_statuses: states.map(normalize) };
}

export function applyStatus(itemId: string, target: ItemStatus): ItemStatus {
  execFileSync('linear', ['issue', 'update', itemId, '--state', target.name, '--no-input']);
  return target;
}
