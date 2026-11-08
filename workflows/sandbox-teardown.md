# Sandbox Teardown

## Input

| Input | Description |
| --- | --- |
| `sandbox_context` | Complete returned sandbox context. |

## Steps

`SandboxContext` is the serializable ownership record defined in
`../commands/sandbox-context.ts`. Carry the returned object unchanged from
preparation to teardown, including after failure, so cleanup can be retried.

Run from this file's directory:

```sh
node ../commands/sandbox-teardown.ts <<'JSON'
{"sandbox_context": <complete returned context>}
JSON
```

Replace the placeholder with the JSON object returned by preparation. Input is
exactly one JSON object on stdin. The command verifies ownership and removes the
recorded Docker sandbox and worktrees. It accepts partial preparation records
and succeeds when their resources were already removed.

Success: `{ "status": "completed", "sandbox_context": SandboxContext }`.
Failure: `{ "status": "failed", "stage": "input" | "teardown", "reason": string,
"sandbox_context"?: SandboxContext }`, with exit code 1. Keep a teardown failure's
context for retry.

Return the command's JSON result unchanged and end this workflow.
