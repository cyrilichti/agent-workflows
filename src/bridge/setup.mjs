import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { parseEnv } from 'node:util';

const file = '.env';
let contents = existsSync(file) ? readFileSync(file, 'utf8') : readFileSync('.env.example', 'utf8');
const defaults = parseEnv(readFileSync('.env.example', 'utf8'));
const existing = parseEnv(contents);
// Preserve existing values and secrets. AI_MODEL remains an explicit override
// for existing installations; clear it manually to use the CLI default.
for (const [key, value] of Object.entries(defaults)) {
  if (key === 'SECRET_BRIDGE_TOKEN') continue;
  if (!Object.hasOwn(existing, key)) contents += `\n${key}=${value}\n`;
}
if (!existing.SECRET_BRIDGE_TOKEN) {
  const token = Buffer.from(randomBytes(32).toString('hex')).toString('base64');
  if (/^SECRET_BRIDGE_TOKEN=.*$/m.test(contents)) contents = contents.replace(/^SECRET_BRIDGE_TOKEN=.*$/m, `SECRET_BRIDGE_TOKEN=${token}`);
  else contents += `\nSECRET_BRIDGE_TOKEN=${token}\n`;
}
writeFileSync(file, contents, { mode: 0o600 });
console.log('Bridge configuration ready. Review .env; no services were started.');
