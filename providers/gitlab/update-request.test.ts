import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { markReady, replaceDescription } from './update-request.ts';

test('GitLab updater passes exact description and ready title as arguments', (t) => {
  const bin = mkdtempSync(join(tmpdir(), 'gitlab-update-'));
  const oldPath = process.env.PATH;
  const oldLog = process.env.TEST_LOG;
  t.after(() => {
    process.env.PATH = oldPath;
    if (oldLog === undefined) delete process.env.TEST_LOG;
    else process.env.TEST_LOG = oldLog;
    rmSync(bin, { recursive: true, force: true });
  });
  writeFileSync(join(bin, 'glab'), `#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
appendFileSync(process.env.TEST_LOG, JSON.stringify(process.argv.slice(2)) + '\\n');
`, { mode: 0o755 });
  process.env.PATH = `${bin}:${oldPath}`;
  process.env.TEST_LOG = join(bin, 'calls');
  const repo = { host: 'gitlab.example', path: 'acme/repo', url: 'https://gitlab.example/acme/repo' };
  replaceDescription(repo, 8, '# Plan\n');
  markReady(repo, 8, 'Fix CTA');
  const calls = readFileSync(join(bin, 'calls'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(calls[0], ['mr', 'update', '8', '--repo', repo.url,
    '--description', '# Plan\n', '--yes']);
  assert.deepEqual(calls[1], ['mr', 'update', '8', '--repo', repo.url,
    '--ready', '--yes', '--title', 'Fix CTA']);
});
