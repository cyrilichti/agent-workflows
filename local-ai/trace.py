#!/usr/bin/env python3
"""Read the persisted Langfuse generation for an inference request ID (no inference)."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('request_id')
args = parser.parse_args()
root = Path(__file__).resolve().parent
env = dict(line.split('=', 1) for line in (root / '.env').read_text().splitlines() if line and not line.startswith('#'))
trace_id = hashlib.sha256(args.request_id.encode()).hexdigest()[:32]
auth = base64.b64encode((env['LANGFUSE_PUBLIC_KEY'] + ':' + env['LANGFUSE_SECRET_KEY']).encode()).decode()
url = 'http://localhost:3001/api/public/v2/observations?traceId=' + trace_id + '&fields=core,basic,time,io,metadata,model,usage'
request = urllib.request.Request(url, headers={'Authorization': 'Basic ' + auth})
with urllib.request.urlopen(request, timeout=15) as response:
    result = json.load(response)
if not result.get('data'):
    raise SystemExit('Trace not visible yet. Check traceStatus and Langfuse health, then retry this read.')
print(json.dumps(result, indent=2))
