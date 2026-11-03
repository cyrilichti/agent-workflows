import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { startBridge, headers } from '../fixtures/start-bridge.ts';
import { ScriptExecutionService } from './script-execution.service.ts';


test('scripts HTTP contract executes arbitrary project files and rejects invalid entrypoints', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'scripts-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const directory = join(root, 'project');
  mkdirSync(directory);
  mkdirSync(join(directory, 'folder.ts'));
  writeFileSync(join(directory, 'custom.ts'), `process.stdout.write(JSON.stringify({args:process.argv.slice(2),cwd:process.cwd()})); process.stderr.write('diagnostic');`);
  writeFileSync(join(directory, 'plain.ts'), `process.stdout.write('not JSON');`);
  writeFileSync(join(directory, 'fail.ts'), 'process.exit(2);');
  writeFileSync(join(root, 'outside.ts'), 'process.stdout.write("outside");');
  writeFileSync(join(directory, 'other.js'), '');
  symlinkSync(join(root, 'outside.ts'), join(directory, 'escape.ts'));
  symlinkSync(root, join(directory, 'escape-dir'));
  symlinkSync(join(directory, 'other.js'), join(directory, 'wrong.ts'));
  symlinkSync(join(directory, 'custom.ts'), join(directory, 'alias.ts'));
  symlinkSync(directory, join(root, 'project-link'));
  const bridge = await startBridge(t, 'real', false, join(root, 'project-link'));
  const url = `${bridge.url}/scripts`;
  const post = (input: unknown) => fetch(url, { method: 'POST', headers, body: JSON.stringify(input) });
  assert.equal((await fetch(url, { method: 'POST', body: '{}' })).status, 401);
  const malformed = await fetch(url, { method: 'POST', headers, body: '{' });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'invalid_json' });
  const args = ['spaces here', '$(touch nope); echo hello', '--eval', 'é', ''];
  for (const path of ['custom.ts', 'alias.ts']) {
    const response = await post({ path, args });
    assert.equal(response.status, 200);
    const output = await response.json();
    assert.deepEqual(JSON.parse(output.stdout), { args, cwd: realpathSync(directory) });
    assert.equal(output.stderr, 'diagnostic');
  }
  const plain = await post({ path: 'plain.ts' });
  assert.deepEqual(await plain.json(), { stdout: 'not JSON', stderr: '' });
  for (const input of [null, [], {}, { path: '' }, { path: '/absolute.ts' },
    { path: 'custom.ts', args: null }, { path: 'custom.ts', args: [1] },
    { path: 'custom.ts', args: ['\0'] }, { path: 'bad\0.ts' }, { path: 'other.js' }]) {
    const response = await post(input);
    assert.equal(response.status, 400, JSON.stringify(input));
    assert.deepEqual(await response.json(), { error: 'invalid_script_input' });
  }
  for (const path of ['../outside.ts', 'escape.ts', 'escape-dir/outside.ts', 'folder.ts', 'missing.ts', 'wrong.ts']) {
    const response = await post({ path });
    assert.equal(response.status, 400, path);
    assert.deepEqual(await response.json(), { error: 'invalid_script_path' });
  }
  const failed = await post({ path: 'fail.ts' });
  assert.equal(failed.status, 502);
  assert.deepEqual(await failed.json(), { error: 'script_failed' });
});

test('script execution bounds duration and combined stdout/stderr', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'scripts-limits-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  writeFileSync(join(directory, 'wait.ts'), 'setInterval(() => {}, 1000);');
  writeFileSync(join(directory, 'large.ts'), `process.stdout.write('a'.repeat(600)); process.stderr.write('b'.repeat(600));`);
  const service = new ScriptExecutionService(directory, { timeoutMs: 500, maxOutputBytes: 1000 });
  await assert.rejects(service.execute({ path: 'wait.ts' }), { status: 504, code: 'script_timeout' });
  await assert.rejects(service.execute({ path: 'large.ts' }), { status: 502, code: 'script_output_too_large' });
});
