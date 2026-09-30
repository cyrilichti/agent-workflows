#!/usr/bin/env python3
"""Initialize this private local Flowise instance, import the example, or run it."""
import argparse
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent
BASE = 'http://localhost:3000/api/v1'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['install', 'run'])
    parser.add_argument('--request-id')
    parser.add_argument('--prompt')
    args = parser.parse_args()
    os.umask(0o077)
    private = ROOT / '.local'
    private.mkdir(exist_ok=True)
    account_path = private / 'flowise-account.json'
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def request(path, body=None):
        req = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(),
                                     headers={'Content-Type': 'application/json', 'x-request-from': 'internal'})
        with opener.open(req, timeout=120) as response:
            return json.load(response)
    if not account_path.exists():
        if args.action != 'install': raise SystemExit('Run install first.')
        account = {'email': 'local@example.test', 'password': secrets.token_urlsafe(32)}
        account_path.write_text(json.dumps(account))
    account = json.loads(account_path.read_text())
    try:
        request('/auth/login', account)
    except urllib.error.HTTPError as error:
        if args.action != 'install' or error.code not in (400, 401, 404): raise
        request('/account/register', {'user': {'name': 'Local user', 'email': account['email'], 'credential': account['password']}})
        request('/auth/login', account)
    id_path = private / 'flowise-id'
    if args.action == 'install':
        if id_path.exists():
            flow_id = id_path.read_text().strip()
            request('/chatflows/' + flow_id)
            print('Existing workflow retained: ' + flow_id)
            return
        flow = request('/chatflows', {'name': 'Local AI — Codex or API', 'type': 'AGENTFLOW',
                                     'flowData': (ROOT / 'workflow.json').read_text(), 'deployed': True, 'isPublic': False})
        id_path.write_text(flow['id'])
        print('Workflow imported: ' + flow['id'])
        print('Local Flowise login is stored in local-ai/.local/flowise-account.json.')
    else:
        if not args.request_id or not args.prompt: raise SystemExit('Supply --request-id and --prompt.')
        flow_id = id_path.read_text().strip()
        result = request('/prediction/' + flow_id, {'form': {'requestId': args.request_id, 'prompt': args.prompt}, 'streaming': False})
        print(json.dumps(result, indent=2))

if __name__ == '__main__':
    try: main()
    except urllib.error.HTTPError as error:
        raise SystemExit(f'Flowise returned HTTP {error.code}: {error.read().decode()[:800]}')
