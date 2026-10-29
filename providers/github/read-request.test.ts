import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readRequest } from './read-request.ts';

test('GitHub reader normalizes one pull request snapshot', (t) => {
  const bin = mkdtempSync(join(tmpdir(), 'github-read-'));
  const oldPath = process.env.PATH;
  t.after(() => { process.env.PATH = oldPath; rmSync(bin, { recursive: true, force: true }); });
  writeFileSync(join(bin, 'gh'), `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  number: 7, title: 'Fix CTA', state: 'open', merged: false, draft: true,
  head: { ref: 'fix/cta', sha: 'abc' }, base: { ref: 'main' }, body: null,
  html_url: 'https://github.com/acme/repo/pull/7',
}));
`, { mode: 0o755 });
  process.env.PATH = `${bin}:${oldPath}`;
  const result = readRequest({ host: 'github.com', owner: 'acme', repo: 'repo' }, 7);
  assert.equal(result.head_sha, 'abc');
  assert.equal(result.body, '');
  assert.equal(result.source_branch, 'fix/cta');
  assert.equal(result.draft, true);
});

test('GitHub review snapshot reads all activity and freezes base and head', (t) => {
  const bin = mkdtempSync(join(tmpdir(), 'github-review-'));
  const oldPath = process.env.PATH;
  t.after(() => { process.env.PATH = oldPath; rmSync(bin, { recursive: true, force: true }); });
  writeFileSync(join(bin, 'gh'), `#!/usr/bin/env node
const path = process.argv.at(-1);
if (path.includes('/comments?')) process.stdout.write(JSON.stringify([[{id: 1, body: 'Required'}]]));
else if (path.includes('/reviews?')) process.stdout.write(JSON.stringify([[{id: 2, body: 'Review'}]]));
else process.stdout.write(JSON.stringify({
  number: 7, title: 'Fix CTA', state: 'open', merged: false, draft: false,
  head: { ref: 'fix/cta', sha: 'abc' }, base: { ref: 'main', sha: 'base' },
  body: '# Plan', html_url: 'https://github.com/acme/repo/pull/7',
}));
`, { mode: 0o755 });
  process.env.PATH = `${bin}:${oldPath}`;
  const result = readRequest({ host: 'github.com', owner: 'acme', repo: 'repo' }, 7,
    'review_snapshot');
  assert.ok('comparison' in result && 'review_activity' in result);
  assert.deepEqual(result.comparison, { base_sha: 'base', head_sha: 'abc' });
  assert.equal(result.review_activity?.comments.length, 1);
  assert.equal(result.review_activity?.reviews.length, 1);
});
