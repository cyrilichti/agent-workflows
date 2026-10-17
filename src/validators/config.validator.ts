import { MAX_TIMEOUT_MS } from '../config/keys.ts';
import type { AppConfig } from '../types/app-config.types.ts';
import type { Validator } from '../types/validator.types.ts';

export class ConfigValidator implements Validator<AppConfig> {
  validate(value: unknown): asserts value is AppConfig {
    const config = value as AppConfig;
    if (config.providerName === 'openai-api' && !config.model) {
      throw new Error('Set AI_MODEL for openai-api.');
    }
    const required = {
      LANGFUSE_PUBLIC_KEY: config.langfuse.publicKey,
      LANGFUSE_SECRET_KEY: config.langfuse.secretKey,
      SECRET_BRIDGE_TOKEN: config.http.token,
    };
    for (const [name, setting] of Object.entries(required)) {
      if (!setting) throw new Error(`Missing configuration: ${name}. Set it in .env.`);
    }
    const { timeoutMs } = config.execution;
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS) {
      throw new Error(`REQUEST_TIMEOUT_MS must be 1–${MAX_TIMEOUT_MS}.`);
    }
    const { port } = config.http;
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('Invalid BRIDGE_PORT.');
    }
  }
}
