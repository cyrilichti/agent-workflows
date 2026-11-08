# Sandbox Teardown

## Input

| Input | Description |
| --- | --- |
| `sandbox_context` | Context returned by preparation. |

## Steps

Run from this file's directory with the supplied `sandbox_context`:

```sh
node ../commands/sandbox-teardown.ts <<'JSON'
{"sandbox_context": <sandbox_context>}
JSON
```

Success: `{ "status": "completed", "sandbox_context": SandboxContext }`.
Failure: `{ "status": "failed", "stage": "input" | "teardown", "reason": string,
"sandbox_context"?: SandboxContext }`, with exit code 1.

Return the command's JSON result unchanged and end this workflow.
