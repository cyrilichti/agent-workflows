import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ScriptExecutionService } from './script-execution.service.ts';
test('script execution bounds duration and combined stdout/stderr', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'scripts-limits-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  writeFileSync(join(directory, 'wait.ts'), 'setInterval(() => {}, 1000);');
  writeFileSync(join(directory, 'large.ts'), `process.stdout.write('a'.repeat(600)); process.stderr.write('b'.repeat(600));`);
  const service = new ScriptExecutionService(directory, { timeoutMs: 500, maxOutputBytes: 1000 });
  await assert.rejects(service.execute({ path: 'wait.ts' }), { status: 504, code: 'script_timeout' });
  await assert.rejects(service.execute({ path: 'large.ts' }), { status: 502, code: 'script_output_too_large' });
});
