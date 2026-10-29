import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareInspectionContext } from './prepare-inspection-context.ts';
import type { WorkItem } from './read-item.ts';
import type { resolveRequestForProject } from './resolve-request.ts';

const item: WorkItem = {
  id: 'uuid', identifier: 'ICY-134', title: 'Inspect', description: '',
  url: 'https://linear.app/team/issue/ICY-134/inspect', closed: false,
  status: {}, destination: {}, labels: ['agent-planned'], comments: [],
  request_backlinks: ['https://github.com/acme/repo/pull/7'],
};
const request: ReturnType<typeof resolveRequestForProject> = {
  request_id: 7, kind: 'pull_request', title: 'Inspect', state: 'open',
  draft: false, source_branch: 'fix/inspect', target_branch: 'main',
  head_sha: 'abc123',
  body: '# Inspect\n\n**Ticket :** [ICY-134](https://linear.app/team/issue/ICY-134/inspect)\n',
  url: 'https://github.com/acme/repo/pull/7',
};

function git(...args: string[]): string {
  return args[0] === 'branch' ? 'fix/inspect' : 'abc123';
}

test('prepares linked request without a local plan or branch switch', () => {
  const context = prepareInspectionContext('/repo', item, request, 7, git);
  assert.equal(context.plan_content, request.body);
  assert.equal(context.branch, request.source_branch);
  assert.equal('plan' in context, false);
});

test('rejects unlinked and mismatched request identities', () => {
  assert.throws(() => prepareInspectionContext('/repo', item,
    { ...request, url: 'https://github.com/acme/repo/pull/8' }, undefined, git), /linked/);
  assert.throws(() => prepareInspectionContext('/repo', item, request, 8, git), /linked/);
  assert.throws(() => prepareInspectionContext('/repo', item,
    { ...request, body: request.body.replace('ICY-134', 'ICY-999') }, undefined, git),
  /official item/);
});

test('rejects ineligible requests and mismatched local branch or head', () => {
  assert.throws(() => prepareInspectionContext('/repo', item,
    { ...request, draft: true }, undefined, git), /non-draft/);
  assert.throws(() => prepareInspectionContext('/repo', item, request, undefined,
    () => 'wrong'), /Current branch/);
  assert.throws(() => prepareInspectionContext('/repo', item, request, undefined,
    (...args) => args[0] === 'branch' ? 'fix/inspect' : 'wrong'), /Local HEAD/);
});
