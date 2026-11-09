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

Read the command's JSON result. A completed result has `status: completed`.
Failure has `status: failed`, `stage` (`input` or `teardown`), and `reason`, with
exit code 1. Read the JSON on stdout even when the command exits with code 1,
and report its `stage` and `reason`.

Return the command's JSON result unchanged and end this workflow.
