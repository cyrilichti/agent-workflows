import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiProvider } from '../../../src/bridge/providers/aiProviderFactory.mjs';

test('unknown provider selection fails closed', () => {
  assert.throws(() => createAiProvider('invalid', {}), /Unknown AI_PROVIDER/);
});
