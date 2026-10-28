import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { markReady, replaceDescription } from './update-request.ts';

test('GitHub updater sends the body, title, and ready command to one PR', (t) => {
  const bin = mkdtempSync(join(tmpdir(), 'github-update-'));
  const oldPath = process.env.PATH;
  const oldLog = process.env.TEST_LOG;
  t.after(() => {
    process.env.PATH = oldPath;
    if (oldLog === undefined) delete process.env.TEST_LOG;
    else process.env.TEST_LOG = oldLog;
    rmSync(bin, { recursive: true, force: true });
  });
  writeFileSync(join(bin, 'gh'), `#!/usr/bin/env node
import { appendFileSync, readFileSync } from 'node:fs';
const args = process.argv.slice(2);
const input = args.includes('--input') ? readFileSync(0, 'utf8') : '';
appendFileSync(process.env.TEST_LOG, JSON.stringify({ args, input }) + '\\n');
`, { mode: 0o755 });
  process.env.PATH = `${bin}:${oldPath}`;
  process.env.TEST_LOG = join(bin, 'calls');
  const repo = { host: 'github.com', owner: 'acme', repo: 'repo' };
  replaceDescription(repo, 7, '# Plan\n');
  markReady(repo, 7, 'Fix CTA', true);
  const calls = readFileSync(join(bin, 'calls'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(JSON.parse(calls[0].input).body, '# Plan\n');
  assert.equal(JSON.parse(calls[1].input).title, 'Fix CTA');
  assert.deepEqual(calls[2].args, ['pr', 'ready', '7', '--repo', 'github.com/acme/repo']);
});
