import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

const root = dirname(import.meta.dirname);

test('both hotfix invocations route to the workflow loaded by the native skill', () => {
  const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8');
  const row = agents.split('\n').find(line => line.includes('`/hotfix`') && line.includes('`$hotfix`'));
  assert.ok(row);
  const workflow = /`(workflows\/[^`]+)`/.exec(row)?.[1];
  assert.ok(workflow);
  const skillPath = join(root, 'skills/hotfix/SKILL.md');
  const skill = readFileSync(skillPath, 'utf8');
  const target = /Read `([^`]+)` completely/.exec(skill)?.[1];
  assert.ok(target);
  assert.equal(resolve(dirname(skillPath), target), join(root, workflow));
  assert.ok(readFileSync(join(root, workflow), 'utf8').length);
});

test('derived consuming-project ignore rules retain the downloaded hotfix skill', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hotfix-install-'));
  try {
    execFileSync('git', ['init', '--quiet', directory]);
    const rules = readFileSync(join(root, '.gitignore'), 'utf8').split('\n')
      .filter(line => /^(?:!?plans\/|!?skills\/)/.test(line))
      .map(line => line.startsWith('!') ? `!.agents/${line.slice(1)}` : `.agents/${line}`);
    writeFileSync(join(directory, '.gitignore'), rules.join('\n'));
    for (const path of ['.agents/skills/hotfix/SKILL.md', '.agents/skills/external/SKILL.md',
      '.agents/plans/.gitkeep', '.agents/plans/local.plan.md']) {
      mkdirSync(dirname(join(directory, path)), { recursive: true });
      writeFileSync(join(directory, path), 'fixture');
    }
    const ignored = execFileSync('git', ['check-ignore', '--no-index',
      '.agents/skills/hotfix/SKILL.md', '.agents/skills/external/SKILL.md',
      '.agents/plans/.gitkeep', '.agents/plans/local.plan.md'],
    { cwd: directory, encoding: 'utf8' }).trim().split('\n');
    assert.deepEqual(ignored, ['.agents/skills/external/SKILL.md', '.agents/plans/local.plan.md']);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
