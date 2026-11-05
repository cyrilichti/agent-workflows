import test from 'node:test';
import assert from 'node:assert/strict';
import { AiProviderService } from './ai-provider.service.ts';
import { CodexCliService } from './codex-cli.service.ts';

test('Codex provider selection creates the supported CLI provider', () => {
  assert.ok(new AiProviderService().create('codex', {}) instanceof CodexCliService);
});

test('unsupported provider selections fail clearly even with a model', () => {
  for (const name of ['invalid', 'openai-api']) {
    for (const options of [{}, { model: 'test-model' }]) {
      assert.throws(() => new AiProviderService().create(name, options), {
        message: `Unknown AI_PROVIDER: ${name}`,
      });
    }
  }
});
