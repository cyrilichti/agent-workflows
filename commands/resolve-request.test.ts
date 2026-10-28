import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { resolveRequest } from './resolve-request.ts';

test('resolver reads only the request linked to the exact repository', (t) => {
  const bin = mkdtempSync(join(tmpdir(), 'resolve-request-'));
  const oldPath = process.env.PATH;
  t.after(() => { process.env.PATH = oldPath; rmSync(bin, { recursive: true, force: true }); });
  writeFileSync(join(bin, 'gh'), `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  number: 7, title: 'Fix CTA', state: 'open', merged: false, draft: true,
  head: { ref: 'fix/cta', sha: 'abc' }, base: { ref: 'main' }, body: '',
  html_url: 'https://github.com/acme/repo/pull/7',
}));
`, { mode: 0o755 });
  process.env.PATH = `${bin}:${oldPath}`;
  const repo = { host: 'github.com', owner: 'acme', repo: 'repo' };
  const result = resolveRequest('github', repo, undefined, [
    'https://github.com/other/repo/pull/8',
    'https://github.com/acme/repo/pull/7',
  ], 'fix/cta');
  assert.equal(result.request_id, 7);
  assert.equal(result.head_sha, 'abc');
  assert.throws(() => resolveRequest('github', repo, undefined, [], undefined),
    /exact pull request number/);
});
