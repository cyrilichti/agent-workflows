import { MAX_TIMEOUT_MS } from '../config/keys.ts';
import type { AppConfig } from '../types/app-config.types.ts';
import type { Validator } from '../types/validator.types.ts';
import { isRecord } from '../helper.ts';

export class ConfigValidator implements Validator<AppConfig> {
  validate(value: unknown): asserts value is AppConfig {
    if (!isRecord(value)) {
      throw new Error('Invalid bridge configuration.');
    }
    const { langfuse, http, execution, providerName, model } = value;
    if (!isRecord(langfuse) || !isRecord(http) || !isRecord(execution)) {
      throw new Error('Invalid bridge configuration.');
    }
    if (providerName === 'openai-api' && !model) {
      throw new Error('Set AI_MODEL for openai-api.');
    }
    const required = {
      LANGFUSE_PUBLIC_KEY: langfuse.publicKey,
      LANGFUSE_SECRET_KEY: langfuse.secretKey,
      SECRET_BRIDGE_TOKEN: http.token,
    };
    for (const [name, setting] of Object.entries(required)) {
      if (!setting) throw new Error(`Missing configuration: ${name}. Set it in .env.`);
    }
    const { timeoutMs } = execution;
    if (typeof timeoutMs !== 'number' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS) {
      throw new Error(`REQUEST_TIMEOUT_MS must be 1–${MAX_TIMEOUT_MS}.`);
    }
    const { port } = http;
    if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('Invalid BRIDGE_PORT.');
    }
  }
}
