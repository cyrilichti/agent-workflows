import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { publishInspectionReview } from './publish-inspection-review.ts';

const head = 'a'.repeat(40);
const base = 'b'.repeat(40);
const current = {
  request_id: 7, kind: 'pull_request' as const, title: 'Fix', state: 'open',
  draft: false, source_branch: 'fix/inspect', target_branch: 'main',
  head_sha: head, body: '', url: 'https://github.com/acme/repo/pull/7',
};
const finding = {
  id: 'RF-001', head_sha: head,
  body: `### Finding RF-001\n\n<!-- agent-workflows-finding id="RF-001" head="${head}" -->`,
  severity: 'blocking' as const,
};

test('publishes one GitHub review at frozen SHA and reuses delivery state', () => {
  const calls: Array<Record<string, unknown>> = [];
  const result = publishInspectionReview('/repo', {
    request_id: 7, branch: 'fix/inspect', head_sha: head,
    comparison: { base_sha: base, head_sha: head },
    review_activity: [], anchors: {}, findings: [finding], request_url: current.url,
  }, (_program, _host, _path, payload) => {
    calls.push(payload);
    return { id: 19, state: 'COMMENTED' };
  }, () => current);
  assert.equal(result.status, 'succeeded');
  assert.deepEqual(result.published, ['19']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.commit_id, head);
  assert.equal(calls[0]?.event, 'COMMENT');
});

test('does not publish on stale head or when finding already exists', () => {
  let publications = 0;
  const post = () => { publications++; return { id: 19 }; };
  const input = {
    request_id: 7, branch: 'fix/inspect', head_sha: head,
    comparison: { base_sha: base, head_sha: head },
    anchors: {},
    review_activity: [{ id: 1,
      body: `<!-- agent-workflows-finding id="RF-001" head="${head}" -->` }],
    findings: [finding], request_url: current.url,
  };
  assert.equal(publishInspectionReview('/repo', input, post, () => current).status,
    'succeeded');
  assert.equal(publishInspectionReview('/repo', input, post,
    () => ({ ...current, head_sha: base })).status, 'stale');
  assert.equal(publications, 0);
});

test('publishes GitLab discussion with the version SHAs', () => {
  const url = 'https://gitlab.example/acme/repo/-/merge_requests/8';
  const payloads: Array<Record<string, unknown>> = [];
  const result = publishInspectionReview('/repo', {
    request_id: 8, branch: 'fix/inspect', head_sha: head,
    comparison: { base_sha: base, start_sha: 'c'.repeat(40), head_sha: head },
    anchors: { 'src/a.ts': { old_lines: [], new_lines: [12] } },
    review_activity: [], findings: [{ ...finding,
      anchor: { path: 'src/a.ts', line: 12, side: 'RIGHT' } }], request_url: url,
  }, (_program, _host, _path, payload) => {
    payloads.push(payload);
    return { id: 'discussion', notes: [{ body: finding.body }] };
  }, () => ({ ...current, kind: 'merge_request', request_id: 8, url }));
  assert.equal(result.status, 'succeeded');
  assert.deepEqual(payloads[0]?.position, {
    position_type: 'text', base_sha: base, start_sha: 'c'.repeat(40), head_sha: head,
    old_path: 'src/a.ts', new_path: 'src/a.ts', new_line: 12,
  });
});

test('GitLab publication sends JSON with an explicit content type', (t) => {
  const bin = mkdtempSync(join(tmpdir(), 'gitlab-inspection-'));
  const oldPath = process.env.PATH;
  const oldLog = process.env.TEST_LOG;
  t.after(() => {
    process.env.PATH = oldPath;
    if (oldLog === undefined) delete process.env.TEST_LOG;
    else process.env.TEST_LOG = oldLog;
    rmSync(bin, { recursive: true, force: true });
  });
  writeFileSync(join(bin, 'glab'), `#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
writeFileSync(process.env.TEST_LOG, JSON.stringify({
  args: process.argv.slice(2), input: readFileSync(0, 'utf8'),
}));
const payload = JSON.parse(readFileSync(process.env.TEST_LOG, 'utf8'));
process.stdout.write(JSON.stringify({ id: 'discussion', notes: [{ body: JSON.parse(payload.input).body }] }));
`, { mode: 0o755 });
  process.env.PATH = `${bin}:${oldPath}`;
  process.env.TEST_LOG = join(bin, 'call');

  const url = 'https://gitlab.example/acme/repo/-/merge_requests/8';
  const result = publishInspectionReview('/repo', {
    request_id: 8, branch: 'fix/inspect', head_sha: head,
    comparison: { base_sha: base, start_sha: 'c'.repeat(40), head_sha: head },
    anchors: {}, review_activity: [], findings: [finding],
    request_url: url,
  }, undefined, () => ({ ...current, kind: 'merge_request', request_id: 8, url }));
  const call = JSON.parse(readFileSync(join(bin, 'call'), 'utf8')) as {
    args: string[]; input: string;
  };
  assert.equal(result.status, 'succeeded');
  assert.deepEqual(JSON.parse(call.input), { body: finding.body });
  assert.ok(call.args.includes('Content-Type: application/json'));
});
