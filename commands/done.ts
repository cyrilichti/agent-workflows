import { basename, dirname, join } from 'node:path';
import { resolveConfiguredProvider } from './resolve-item-provider.ts';
import { resolveExistingItem } from './resolve-existing-item.ts';
import { readItem } from './read-item.ts';
import type { ItemProvider } from './read-item.ts';
import { requestRepositoryForProject, resolveRequest } from './resolve-request.ts';
import { readRequest as readGitHubRequest } from '../providers/github/read-request.ts';
import { readRequest as readGitLabRequest } from '../providers/gitlab/read-request.ts';
import { squashMerge as mergeGitHub } from '../providers/github/merge-request.ts';
import { squashMerge as mergeGitLab } from '../providers/gitlab/merge-request.ts';
import * as linearStatus from '../providers/linear/transition-item-status.ts';
import * as clickupStatus from '../providers/clickup/transition-item-status.ts';
import type { GitHubRepository, GitLabRepository } from './resolve-version-repository.ts';

type DoneResult = {
  status: 'complete' | 'stopped' | 'partial';
  request: { id?: number; repository?: string; state: string };
  item: { id?: string; status: string };
  stage?: string;
  reason?: string;
  remaining?: string;
};

type RepositoryContext = ReturnType<typeof requestRepositoryForProject>;
type DeliveryRequest = {
  request_id: number; state: string; draft: boolean; source_branch: string;
  target_branch: string; head_sha: string; url: string;
  delivery_state: { merge_status: string; blocker?: string };
};

function readDelivery(context: RepositoryContext, id: number): DeliveryRequest {
  return (context.provider === 'github'
    ? readGitHubRequest(context.repository as GitHubRepository, id, 'delivery_state')
    : readGitLabRequest(context.repository as GitLabRepository, id, 'delivery_state')) as
    unknown as DeliveryRequest;
}

export function completeDone(root: string, reference = '', query = ''): DoneResult {
  const result: DoneResult = {
    status: 'stopped', request: { state: 'not attempted' }, item: { status: 'not attempted' },
  };
  let merged = false;
  let itemMutationAttempted = false;
  let stage = 'resolve_item';
  try {
    const configured = resolveConfiguredProvider(join(root, 'agent-workflows.yaml'), 'item');
    if (configured !== 'linear' && configured !== 'clickup') {
      throw new Error('Unsupported item provider.');
    }
    const provider: ItemProvider = configured;
    const itemId = resolveExistingItem(provider, reference, query);
    stage = 'read_item';
    const item = readItem(provider, itemId);
    const initialStatus = item.status as { name?: string; status?: string } | null;
    result.item = { id: item.identifier ?? item.id,
      status: initialStatus?.name ?? initialStatus?.status ?? 'unavailable' };
    if (!item.labels.includes('agent-inspected')) {
      throw new Error('The official item lacks the agent-inspected label.');
    }
    stage = 'resolve_request';
    const context = requestRepositoryForProject(root);
    const repositoryName = context.provider === 'github'
      ? `${context.repository.host}/${context.repository.owner}/${context.repository.repo}`
      : `${context.repository.host}/${context.repository.path}`;
    const request = resolveRequest(context.provider, context.repository, undefined,
      item.request_backlinks, undefined, 'delivery_state', ['open', 'merged']) as
      unknown as DeliveryRequest;
    result.request = { id: request.request_id,
      repository: `${context.provider}/${repositoryName}`, state: request.state };
    if (request.draft || !request.source_branch || !request.target_branch) {
      throw new Error('The linked request identity or delivery state is incomplete.');
    }
    const delivery = request.delivery_state;
    if (request.state === 'open' && delivery.merge_status !== 'mergeable') {
      throw new Error(`Request is ${delivery.merge_status}: ${delivery.blocker ?? 'no provider reason'}.`);
    }
    stage = 'resolve_item_status';
    const statusAdapter = provider === 'linear' ? linearStatus : clickupStatus;
    const officialItem = provider === 'linear'
      ? { state: item.status, team: (item.destination as { team: unknown }).team,
        identifier: item.identifier }
      : { status: item.status, list: (item.destination as { list: unknown }).list };
    const statusResolution = statusAdapter.readStatuses(item.id, officialItem);
    const targets = statusResolution.available_statuses.filter(status =>
      status.category === 'completed');
    if (targets.length !== 1) {
      throw new Error(targets.length ? 'Multiple done statuses are available.' :
        'No done status is available.');
    }
    const target = targets[0]!;
    if (!statusResolution.item_reference) {
      throw new Error('Item CLI reference is unavailable.');
    }
    const alreadyDone = statusResolution.current_status.id === target.id;
    if (request.state === 'open') {
      stage = 'recheck_request';
      const current = readDelivery(context, request.request_id);
      if (current.source_branch !== request.source_branch ||
        current.target_branch !== request.target_branch || current.head_sha !== request.head_sha ||
        current.state !== 'open' || current.draft ||
        current.delivery_state.merge_status !== 'mergeable') {
        throw new Error('The linked request changed or is no longer mergeable.');
      }
      try {
        stage = 'merge_request';
        if (context.provider === 'github') {
          mergeGitHub(context.repository as GitHubRepository, request.request_id, request.head_sha);
        } else {
          mergeGitLab(context.repository as GitLabRepository, request.request_id, request.head_sha);
        }
      } catch (error) {
        // A failed CLI call can still have completed the merge; the exact read decides.
        result.reason = error instanceof Error ? error.message : String(error);
      }
      let observed;
      try {
        observed = readDelivery(context, request.request_id);
      } catch {
        result.request.state = 'unobserved';
        throw new Error('The merge outcome could not be observed.');
      }
      result.request.state = observed.state;
      if (observed.state !== 'merged') {
        throw new Error(result.reason ?? `Merge did not complete: ${observed.state}.`);
      }
    }
    merged = true;
    result.request.state = 'merged';
    if (!alreadyDone) {
      stage = 'complete_item';
      itemMutationAttempted = true;
      statusAdapter.applyStatus(statusResolution.item_reference, target);
      const observedItem = readItem(provider, item.id);
      const observedStatus = observedItem.status as { id?: string; name?: string; status?: string };
      result.item.status = observedStatus.name ?? observedStatus.status ?? 'unobserved';
      if (observedStatus.id !== target.id &&
        (observedStatus.name ?? observedStatus.status) !== target.name) {
        throw new Error('The item done status was not observed.');
      }
    } else {
      result.item.status = target.name;
    }
    result.status = 'complete';
    delete result.reason;
  } catch (error) {
    result.stage = stage;
    result.reason = error instanceof Error ? error.message : String(error);
    if (merged) {
      result.status = 'partial';
      if (itemMutationAttempted) result.item.status = 'unobserved';
      result.remaining = `Verify item ${result.item.id} and move it to done if needed.`;
    }
  }
  return result;
}

if (import.meta.main) {
  const parent = dirname(import.meta.dirname);
  const root = basename(parent) === '.agents' ? dirname(parent) : parent;
  const [input, query] = process.argv.slice(2);
  const result = completeDone(root, input === '--query' ? '' : input,
    input === '--query' ? query : '');
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status !== 'complete') process.exitCode = 1;
}
