import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readRequest } from './read-request.ts';

test('GitLab reader normalizes one merge request snapshot', (t) => {
  const bin = mkdtempSync(join(tmpdir(), 'gitlab-read-'));
  const oldPath = process.env.PATH;
  t.after(() => { process.env.PATH = oldPath; rmSync(bin, { recursive: true, force: true }); });
  writeFileSync(join(bin, 'glab'), `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  iid: 8, title: 'Fix CTA', state: 'opened', work_in_progress: true,
  source_branch: 'fix/cta', sha: 'def', target_branch: 'main',
  web_url: 'https://gitlab.example/acme/repo/-/merge_requests/8',
}));
`, { mode: 0o755 });
  process.env.PATH = `${bin}:${oldPath}`;
  const result = readRequest({ host: 'gitlab.example', path: 'acme/repo',
    url: 'https://gitlab.example/acme/repo' }, 8);
  assert.equal(result.head_sha, 'def');
  assert.equal(result.state, 'open');
  assert.equal(result.body, '');
  assert.equal(result.draft, true);
});

test('GitLab review snapshot uses latest diff version SHAs', (t) => {
  const bin = mkdtempSync(join(tmpdir(), 'gitlab-review-'));
  const oldPath = process.env.PATH;
  t.after(() => { process.env.PATH = oldPath; rmSync(bin, { recursive: true, force: true }); });
  writeFileSync(join(bin, 'glab'), `#!/usr/bin/env node
const path = process.argv.at(-1);
if (path.endsWith('/versions')) process.stdout.write(JSON.stringify([{
  head_commit_sha: 'def', base_commit_sha: 'base', start_commit_sha: 'start',
}]));
else if (path.endsWith('/discussions')) process.stdout.write(JSON.stringify([{id: 'd1', notes: []}]));
else if (path.endsWith('/approvals')) process.stdout.write(JSON.stringify({approved_by: []}));
else if (path.endsWith('/reviewers')) process.stdout.write(JSON.stringify([]));
else process.stdout.write(JSON.stringify({
  iid: 8, title: 'Fix CTA', state: 'opened', draft: false,
  source_branch: 'fix/cta', sha: 'def', target_branch: 'main',
  web_url: 'https://gitlab.example/acme/repo/-/merge_requests/8',
}));
`, { mode: 0o755 });
  process.env.PATH = `${bin}:${oldPath}`;
  const result = readRequest({ host: 'gitlab.example', path: 'acme/repo',
    url: 'https://gitlab.example/acme/repo' }, 8, 'review_snapshot');
  assert.ok('comparison' in result && 'review_activity' in result);
  assert.deepEqual(result.comparison,
    { base_sha: 'base', start_sha: 'start', head_sha: 'def' });
  assert.equal(result.review_activity?.discussions.length, 1);
});
