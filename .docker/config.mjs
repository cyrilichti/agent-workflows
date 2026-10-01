import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync, chmodSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function readConfig(root) {
  return Object.fromEntries(readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .map(line => {
      const i = line.indexOf('=');
      if (i < 1) throw new Error('Use KEY=value entries in .env.');
      let value = line.slice(i + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      return [line.slice(0, i).trim(), value];
    }));
}
export function writeConfig(root, config) {
  const choices = ['COMPOSE_PROFILES', 'AI_MODEL', 'INFERENCE_ENABLED', 'OPENAI_API_KEY'];
  const lines = ['# Choose codex or openai-api. API billing is separate from ChatGPT.',
    ...choices.map(key => `${key}=${config[key] ?? ''}`), '',
    '# Generated installation secrets. Keep these values and this file private.',
    ...Object.entries(config).filter(([key]) => !choices.includes(key)).map(([key, value]) => `${key}=${value}`)];
  const path = join(root, '.env');
  writeFileSync(`${path}.tmp`, lines.join('\n') + '\n', { mode: 0o600 });
  chmodSync(`${path}.tmp`, 0o600);
  renameSync(`${path}.tmp`, path);
}
export function prepare(root, denyList) {
  const env = join(root, '.env');
  const legacy = join(root, 'local-ai');
  mkdirSync(join(root, '.local'), { recursive: true, mode: 0o700 });
  // Existing installations keep the exact same secrets, login and named volumes.
  if (!existsSync(env) && existsSync(join(legacy, '.env'))) renameSync(join(legacy, '.env'), env);
  const oldPrivate = join(legacy, '.local');
  if (existsSync(oldPrivate)) for (const name of readdirSync(oldPrivate)) {
    const target = join(root, '.local', name);
    const source = join(oldPrivate, name);
    if (!existsSync(target)) renameSync(source, target);
    else if (!readFileSync(source).equals(readFileSync(target))) throw new Error(`Conflicting installation file: .local/${name}. Keep the intended installation before restarting.`);
  }
  const config = existsSync(env) ? readConfig(root) : {};
  config.COMPOSE_PROFILES ??= config.AI_PROVIDER ?? 'codex';
  delete config.AI_PROVIDER;
  if (!['codex', 'openai-api'].includes(config.COMPOSE_PROFILES)) throw new Error('COMPOSE_PROFILES must be codex or openai-api.');
  config.AI_MODEL ??= 'gpt-6-luna';
  config.INFERENCE_ENABLED ??= 'false';
  if (!['true', 'false'].includes(config.INFERENCE_ENABLED)) throw new Error('INFERENCE_ENABLED must be true or false.');
  config.OPENAI_API_KEY ??= existsSync(join(root, '.local/openai-api-key')) ? readFileSync(join(root, '.local/openai-api-key'), 'utf8').trim() : '';
  config.CODEX_WORKSPACE_ID ??= '';
  config.FLOWISE_HTTP_DENY_LIST ??= denyList.join(',');
  for (const key of ['FLOWISE_DB_PASSWORD', 'POSTGRES_PASSWORD', 'NEXTAUTH_SECRET', 'LANGFUSE_SALT', 'LANGFUSE_ENCRYPTION_KEY',
    'CLICKHOUSE_PASSWORD', 'MINIO_PASSWORD', 'REDIS_PASSWORD', 'LANGFUSE_SECRET_KEY', 'LANGFUSE_ADMIN_PASSWORD',
    'FLOWISE_JWT_SECRET', 'FLOWISE_REFRESH_SECRET', 'FLOWISE_SESSION_SECRET', 'FLOWISE_HASH_SECRET']) {
    config[key] ??= randomBytes(32).toString('hex');
  }
  config.LANGFUSE_PUBLIC_KEY ??= 'pk-lf-' + randomBytes(16).toString('hex');
  writeConfig(root, config);
  return config;
}
