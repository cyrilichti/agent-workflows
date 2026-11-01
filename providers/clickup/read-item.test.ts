import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readItem } from '../../commands/read-item.ts';

function createFixture(t: test.TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'clickup-work-item-'));
  const previousPath = process.env.PATH;
  t.after(() => {
    process.env.PATH = previousPath;
    rmSync(root, { recursive: true, force: true });
  });
  writeFileSync(
    join(root, 'clickup-cli'),
    `#!/usr/bin/env node
const fs = require('node:fs');
const root = ${JSON.stringify(root)};
const args = process.argv.slice(2);
fs.appendFileSync(root + '/calls.jsonl', JSON.stringify(args) + '\\n');
const file = args[0] === 'task' ? 'task' : args.includes('--start') ? 'comments-2' : 'comments-1';
process.stdout.write('Warning: fixture\\n' + fs.readFileSync(root + '/' + file + '.json'));
`,
    { mode: 0o755 },
  );
  process.env.PATH = `${root}:${previousPath}`;
  writeFileSync(
    join(root, 'task.json'),
    JSON.stringify([
      {
        id: 'abc',
        name: 'Fix CTA',
        url: 'https://app.clickup.com/t/abc',
        markdown_description: '',
        description: 'plain fallback',
        status: { type: 'open' },
        tags: [{ name: 'agent-planned' }],
        attachments: [{ id: 'attachment-1' }],
        linked_tasks: [{ id: 'linked-1' }],
        list: { name: 'Queue' },
      },
    ]),
  );
  const page = Array.from({ length: 25 }, (_, i) => {
    return {
      id: `${i}`,
      date: `${100 - i}`,
      comment_text: 'truncated',
      comment: [{ text: `Full ${i}` }, { text: ' content' }],
    };
  });
  writeFileSync(join(root, 'comments-1.json'), JSON.stringify(page));
  writeFileSync(
    join(root, 'comments-2.json'),
    JSON.stringify([
      page[24],
      {
        id: '26',
        date: '1',
        comment: [{ text: 'Draft MR: https://gitlab.example/acme/repo/-/merge_requests/7' }],
      },
    ]),
  );
  return { root, page };
}

test('ClickUp read follows full comment pages, deduplicates and reconstructs untruncated text', (t) => {
  const { root } = createFixture(t);
  const item = readItem('clickup', 'abc');
  assert.equal(item.description, '');
  assert.equal(item.closed, false);
  assert.equal(item.comments.length, 26);
  assert.equal(item.comments[0]?.body, 'Full 0 content');
  assert.deepEqual(item.request_backlinks, ['https://gitlab.example/acme/repo/-/merge_requests/7']);
  assert.deepEqual(item.attachments, [{ id: 'attachment-1' }]);
  assert.deepEqual(item.linked_resources, [{ id: 'linked-1' }]);
  const calls = readFileSync(join(root, 'calls.jsonl'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => {
      return JSON.parse(line);
    });
  assert.deepEqual(calls[2], [
    'comment',
    'list',
    '--task',
    'abc',
    '--output',
    'json',
    '--start',
    '76',
    '--start-id',
    '24',
  ]);
});

test('ClickUp read rejects incomplete text and repeated pagination boundaries', (t) => {
  const { root, page } = createFixture(t);
  writeFileSync(
    join(root, 'comments-1.json'),
    JSON.stringify([{ id: 'c', comment_text: 'truncated' }]),
  );
  assert.throws(() => {
    return readItem('clickup', 'abc');
  }, /comment text/);
  writeFileSync(join(root, 'comments-1.json'), JSON.stringify(page));
  writeFileSync(join(root, 'comments-2.json'), JSON.stringify(page));
  assert.throws(() => {
    return readItem('clickup', 'abc');
  }, /did not advance/);
});
