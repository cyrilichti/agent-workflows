import { createCodex } from './codex.mjs';
import { createOpenAI } from './openai.mjs';
// Extension point: add an adapter here without changing orchestration or trace handling.
const providers = { codex: createCodex, 'openai-api': createOpenAI };
export function createProvider(name, options) {
  if (!Object.hasOwn(providers, name)) throw new Error(`Unknown AI_PROVIDER: ${name}`);
  return providers[name](options);
}
