import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWriteItemArguments } from './resolve-write-item.ts';

test('write item command accepts the shared positional and --query signatures', () => {
  assert.deepEqual(parseWriteItemArguments(['ICY-123']), { reference: 'ICY-123' });
  assert.deepEqual(parseWriteItemArguments(['https://linear.app/icy/issue/ICY-123']), {
    reference: 'https://linear.app/icy/issue/ICY-123',
  });
  assert.deepEqual(parseWriteItemArguments(['--query', 'Refactor /write']), {
    query: 'Refactor /write',
  });
  assert.throws(() => parseWriteItemArguments([]), /Supply an item/);
  assert.throws(() => parseWriteItemArguments(['--query']), /Supply an item/);
});
