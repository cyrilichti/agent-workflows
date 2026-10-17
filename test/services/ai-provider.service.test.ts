import test from 'node:test';
import assert from 'node:assert/strict';
import { AiProviderService } from '../../src/services/ai-provider.service.ts';

test('unknown provider selection fails closed', () => {
  assert.throws(() => new AiProviderService().create('invalid', {}), /Unknown AI_PROVIDER/);
});

test('API provider requires a model when created directly', () => {
  assert.throws(() => new AiProviderService().create('openai-api', {}), /Set AI_MODEL/);
});
