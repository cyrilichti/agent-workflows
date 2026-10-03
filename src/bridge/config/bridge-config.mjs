import { homedir } from 'node:os';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

/**
 * Load bridge settings without adding service secrets to the CLI environment.
 *
 * @param {object} [options]
 * @param {string} [options.envFile='.env'] File containing bridge-specific settings.
 * @param {NodeJS.ProcessEnv} [options.environment=process.env] Host environment; overrides the file.
 * @param {string} [options.directory=homedir()] Default CLI working directory.
 * @returns {object} Settings grouped by provider, HTTP, execution and tracing.
 * @throws {Error} If the file cannot be read or required settings are invalid.
 */
export function loadBridgeConfig({
  envFile = '.env',
  environment = process.env,
  directory = homedir(),
} = {}) {
  // Service secrets from .env must not be injected into the local CLI environment.
  const cliEnvironment = { ...environment };
  const env = { ...parseEnv(readFileSync(envFile, 'utf8')), ...cliEnvironment };
  const providerName = env.AI_PROVIDER || 'codex';
  const model = env.AI_MODEL || undefined;
  if (providerName === 'openai-api' && !model) {
    throw new Error('Set AI_MODEL for openai-api.');
  }
  for (const name of ['LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY', 'SECRET_BRIDGE_TOKEN']) {
    if (!env[name]) {
      throw new Error(`Missing configuration: ${name}. Set it in .env.`);
    }
  }
  const timeoutMs = Number(env.REQUEST_TIMEOUT_MS || 1800000);
  const port = Number(env.BRIDGE_PORT || 8787);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 1800000) {
    throw new Error('REQUEST_TIMEOUT_MS must be 1–1800000.');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid BRIDGE_PORT.');
  }

  return {
    providerName,
    model,
    providerOptions: {
      model,
      workspace: env.CODEX_WORKSPACE_ID,
      executable: env.CODEX_BIN || 'codex',
      environment: cliEnvironment,
      directory: env.CODEX_WORKING_DIRECTORY || directory,
      key: env.OPENAI_API_KEY,
      keyFile: env.OPENAI_API_KEY_FILE,
    },
    http: {
      host: env.BRIDGE_HOST || '127.0.0.1',
      port,
      token: Buffer.from(env.SECRET_BRIDGE_TOKEN, 'base64').toString('utf8'),
    },
    execution: { enabled: env.INFERENCE_ENABLED === 'true', timeoutMs },
    langfuse: {
      url: env.LANGFUSE_URL || 'http://localhost:3001',
      publicUrl: env.LANGFUSE_PUBLIC_URL || 'http://localhost:3001',
      projectId: env.LANGFUSE_PROJECT_ID || 'local-ai',
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
    },
  };
}
