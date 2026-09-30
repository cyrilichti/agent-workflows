#!/usr/bin/env python3
"""Copy an existing ChatGPT CLI login into the dedicated Docker volume, without configuration."""
import json
import os
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent
source = Path(os.environ.get('CODEX_HOME', str(Path.home() / '.codex'))) / 'auth.json'
auth = json.loads(source.read_text())
if not auth.get('tokens', {}).get('access_token') or auth.get('OPENAI_API_KEY'):
    raise SystemExit('Sign in with ChatGPT using codex login first; API authentication is not accepted here.')
workspace = auth['tokens'].get('account_id')
if not workspace:
    raise SystemExit('Login has no workspace/account ID; authenticate again.')
env_path = root / '.env'
lines = env_path.read_text().splitlines()
configured = next((line.split('=', 1)[1] for line in lines if line.startswith('CODEX_WORKSPACE_ID=')), '')
if configured and configured != workspace:
    raise SystemExit('Host login differs from CODEX_WORKSPACE_ID. Verify the intended workspace before changing it.')
payload = {key: auth[key] for key in ('auth_mode', 'tokens', 'last_refresh') if key in auth}
script = "let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>{require('fs').writeFileSync('/auth/auth.json',s,{mode:0o600});});"
subprocess.run([str(root / 'compose'), 'exec', '-T', 'bridge', 'node', '-e', script], input=json.dumps(payload), text=True, check=True)
env_path.write_text('\n'.join('CODEX_WORKSPACE_ID=' + workspace if line.startswith('CODEX_WORKSPACE_ID=') else line for line in lines) + '\n')
print('ChatGPT login copied to the private volume; workspace: ' + workspace)
print('Recreate bridge to apply the workspace setting: ./local-ai/compose up -d bridge')
