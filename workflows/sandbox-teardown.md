# Sandbox Teardown

## Input

| Input | Description |
| --- | --- |
| `sandbox_context` | Complete returned sandbox context. |

## Steps

Run from this file's directory:

```sh
node ../commands/sandbox-teardown.ts <<'JSON'
{"sandbox_context": <sandbox_context>}
JSON
```

Replace `<sandbox_context>` with the supplied `sandbox_context` JSON object,
unchanged from preparation, including after failure. Send the enclosing JSON
object on stdin.

Success: `{ "status": "completed", "sandbox_context": SandboxContext }`.
Failure: `{ "status": "failed", "stage": "input" | "teardown", "reason": string,
"sandbox_context"?: SandboxContext }`, with exit code 1. Keep a teardown failure's
context for retry.

Return the command's JSON result unchanged and end this workflow.
