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
