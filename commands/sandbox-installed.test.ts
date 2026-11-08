import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

test('installed .agents workflow commands round trip a compact context from their call-site directory', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'sandbox-installed-')));
  let context: any;
  try {
    execFileSync('git', ['init', '-q', root]);
    execFileSync('git', ['-C', root, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '--allow-empty', '-qm', 'init']);
    const installed = join(root, '.agents');
    for (const directory of ['commands', 'workflows', 'rules', 'goals', 'templates', 'skills/sandbox']) {
      cpSync(resolve(directory), join(installed, directory), { recursive: true });
    }
    const agents = readFileSync('AGENTS.md', 'utf8').replace(/`((?:workflows|templates)\/[^`]+)`/g, '`' + '.agents/$1' + '`');
    writeFileSync(join(root, 'AGENTS.md'), agents);
    assert.ok(existsSync(join(root, '.agents/workflows/sandbox.md')));
    assert.ok(existsSync(join(root, '.agents/skills/sandbox/../../workflows/sandbox.md')));
    const ignore = readFileSync('.gitignore', 'utf8').split('\n').filter(line => /^!?skills\//.test(line)).map(line => line.startsWith('!') ? `!.agents/${line.slice(1)}` : `.agents/${line}`).join('\n');
    writeFileSync(join(root, '.gitignore'), ignore);
    assert.notEqual(spawnSync('git', ['-C', root, 'check-ignore', '--quiet', '.agents/skills/sandbox/SKILL.md']).status, 0);
    const bin = join(root, 'bin');
    mkdirSync(bin);
    writeFileSync(join(bin, 'sbx'), `#!${process.execPath}\nconsole.log(process.argv.includes('diagnose') ? JSON.stringify({ checks: ['Authentication','Daemon','Virtualization'].map(name => ({name,status:'pass'})) }) : '');\n`, { mode: 0o755 });
    writeFileSync(join(bin, 'docker'), `#!${process.execPath}\nconsole.log('');\n`, { mode: 0o755 });
    const cwd = join(installed, 'workflows');
    const result = spawnSync(process.execPath, ['../commands/sandbox-prepare.ts'], {
      cwd, input: JSON.stringify({ item_id: 'item', project_directory: root, dependency_directories: [], browser_validation: false }), encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, COMPOSE_FILE: '' },
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const prepared = JSON.parse(result.stdout);
    context = prepared.sandbox_context;
    assert.equal(prepared.status, 'prepared');
    assert.equal(context.docker, null);
    assert.equal(context.repositories.length, 1);
    assert.ok(!('item' in context) && !('plan' in context));
    for (let iteration = 0; iteration < 2; iteration++) {
      const result = spawnSync(process.execPath, ['../commands/sandbox-teardown.ts'], {
        cwd, input: JSON.stringify({ sandbox_context: context }), encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(JSON.parse(result.stdout).status, 'completed');
    }
    assert.ok(existsSync(join(root, '.git')));
    assert.equal(existsSync(context.root), false);
  } finally {
    if (context && existsSync(context.root)) {
      spawnSync(process.execPath, [resolve('commands/sandbox-teardown.ts')], { input: JSON.stringify({ sandbox_context: context }) });
    }
    rmSync(root, { recursive: true, force: true });
  }
});
