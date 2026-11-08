# Sandbox Teardown

## Input

| Input | Description |
| --- | --- |
| `sandbox_context` | Complete returned sandbox context. |

## Steps

Run from this file's directory:

```sh
node ../commands/sandbox-teardown.ts <<'JSON'
{"sandbox_context": <complete returned context>}
JSON
```

Replace the placeholder with the unchanged context returned by preparation,
including after failure, as one JSON object on stdin.

Success: `{ "status": "completed", "sandbox_context": SandboxContext }`.
Failure: `{ "status": "failed", "stage": "input" | "teardown", "reason": string,
"sandbox_context"?: SandboxContext }`, with exit code 1. Keep a teardown failure's
context for retry.

Return the command's JSON result unchanged and end this workflow.
