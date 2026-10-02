import { createCodexCliProvider } from './codexCliProvider.mjs';
import { createOpenAiApiProvider } from './openaiApiProvider.mjs';
// Extension point: add an adapter here without changing orchestration or trace handling.
const providers = { codex: createCodexCliProvider, 'openai-api': createOpenAiApiProvider };

/**
 * Select a provider without coupling HTTP handling to its implementation.
 *
 * @param {string} name Configured provider name.
 * @param {object} options Provider-specific dependencies and settings.
 * @returns {import('../execution/taskContract.mjs').AiProvider}
 * @throws {Error} If the provider name is not registered.
 */
export function createAiProvider(name, options) {
  if (!Object.hasOwn(providers, name)) {
    throw new Error(`Unknown AI_PROVIDER: ${name}`);
  }
  return providers[name](options);
}
