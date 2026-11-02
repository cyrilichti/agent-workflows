import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ProjectResolutionService } from './project-resolution.service.ts';

test('project resolver validates input and returns the script results', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'project-bridge-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const commands = join(directory, '.agents', 'commands');
  mkdirSync(commands, { recursive: true });
  const command = join(commands, 'resolve-local-project-directory.ts');
  writeFileSync(command, `const [list, id] = process.argv.slice(2);
if (list === 'fail') process.exit(2);
if (list === 'invalid') process.stdout.write('invalid');
else if (list === 'none') process.stdout.write(JSON.stringify({status:'not found'}));
else if (list === 'partial') process.stdout.write(JSON.stringify({status:'search incomplete'}));
else process.stdout.write(JSON.stringify({path:'/projects/' + list + '/' + id}));
`);
  const service = new ProjectResolutionService(directory);
  for (const input of [null, {}, { list: '', id: 'issue-1' },
    { list: 'Project', id: ' ' }, { list: 42, id: 'issue-1' }]) {
    await assert.rejects(service.resolve(input), { status: 400, code: 'invalid_project_input' });
  }
  assert.deepEqual(await service.resolve({ list: 'demo', id: 'issue-1' }),
    { path: '/projects/demo/issue-1' });
  assert.deepEqual(await service.resolve({ list: 'none', id: 'issue-1' }), { status: 'not found' });
  assert.deepEqual(await service.resolve({ list: 'partial', id: 'issue-1' }),
    { status: 'search incomplete' });
  await assert.rejects(service.resolve({ list: 'fail', id: 'issue-1' }),
    { status: 502, code: 'project_failed' });
  await assert.rejects(service.resolve({ list: 'invalid', id: 'issue-1' }),
    { status: 502, code: 'invalid_project_result' });
});
