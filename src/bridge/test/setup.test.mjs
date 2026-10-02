import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseEnv } from 'node:util';

test('setup preserves credentials, model overrides on repeated runs without creating a project registry', t => {
  const dir = mkdtempSync(`${tmpdir()}/bridge-setup-`); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const script = fileURLToPath(new URL('../setup.mjs', import.meta.url));
  copyFileSync(new URL('../../../.env.example', import.meta.url), `${dir}/.env.example`);
  writeFileSync(`${dir}/.env`, 'AI_MODEL=chosen\nOPENAI_API_KEY=test-only\nSECRET_BRIDGE_TOKEN=\n');
  execFileSync(process.execPath, [script], { cwd: dir });
  const first = readFileSync(`${dir}/.env`, 'utf8');
  const env = parseEnv(first);
  assert.equal(env.AI_MODEL, 'chosen'); assert.equal(env.OPENAI_API_KEY, 'test-only');
  assert.ok(Buffer.from(env.SECRET_BRIDGE_TOKEN, 'base64').length >= 32);
  const projects = `${dir}/.local/projects.json`;
  assert.equal(existsSync(projects), false);
  execFileSync(process.execPath, [script], { cwd: dir });
  assert.equal(readFileSync(`${dir}/.env`, 'utf8'), first);
  assert.equal(existsSync(projects), false);
});
