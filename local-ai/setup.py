#!/usr/bin/env python3
"""Generate local secrets once; never overwrite an existing installation."""
import ipaddress
from pathlib import Path
import secrets
import os

root = Path(__file__).resolve().parent
os.umask(0o077)
(root / '.local').mkdir(exist_ok=True)
env = root / '.env'
if env.exists():
    raise SystemExit('.env already exists; keeping existing secrets and data.')
# Preserve Flowise's default SSRF deny list, allowing only our bridge /32.
deny = ['0.0.0.0', '10.0.0.0/8', '127.0.0.0/8', '169.254.0.0/16',
        '192.168.0.0/16', '224.0.0.0/4', '240.0.0.0/4', '255.255.255.255/32',
        '::1', 'fc00::/7', 'fe80::/10', 'ff00::/8', 'localhost', 'ip6-localhost']
deny += [str(n) for n in ipaddress.ip_network('172.16.0.0/12').address_exclude(ipaddress.ip_network('172.30.81.10/32'))]
values = dict(AI_PROVIDER='codex', AI_MODEL='gpt-6-luna', INFERENCE_ENABLED='false', CODEX_WORKSPACE_ID='',
              FLOWISE_HTTP_DENY_LIST=','.join(deny))
for key in ['FLOWISE_DB_PASSWORD', 'POSTGRES_PASSWORD', 'NEXTAUTH_SECRET', 'LANGFUSE_SALT', 'LANGFUSE_ENCRYPTION_KEY',
            'CLICKHOUSE_PASSWORD', 'MINIO_PASSWORD', 'REDIS_PASSWORD', 'LANGFUSE_SECRET_KEY',
            'LANGFUSE_ADMIN_PASSWORD', 'FLOWISE_JWT_SECRET', 'FLOWISE_REFRESH_SECRET',
            'FLOWISE_SESSION_SECRET', 'FLOWISE_HASH_SECRET']:
    values[key] = secrets.token_hex(32)
values['LANGFUSE_PUBLIC_KEY'] = 'pk-lf-' + secrets.token_hex(16)
with env.open('x') as f:
    f.write(''.join(f'{k}={v}\n' for k, v in values.items()))
print('Created local-ai/.env (private). Inference stays disabled until you verify authentication and usage.')
