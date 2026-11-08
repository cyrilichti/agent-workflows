# Sandbox Prepare

## Input

| Input | Description |
| --- | --- |
| `item` | Required item ID, native URL, title, or search phrase. |

## Steps

Resolve the official item from this file's directory. For an ID or native URL:

```sh
node ../commands/resolve-existing-item.ts "<item>"
```

For a title or search phrase:

```sh
node ../commands/resolve-existing-item.ts --query "<item>"
```

Continue only on `status: resolved`. On `failed`, report `stage` and `reason`;
on `not_found` or `ambiguous`, report the result and stop.

Set `item_id` to the resolved official item's ID. Read its complete context and
determine whether validating the requested outcome requires browser interaction.
Set `browser_validation` to that decision.

Invoke preparation from this file's directory with the resolved and derived values:

```sh
node ../commands/sandbox-prepare.ts <<'JSON'
{"item_id":"<resolved item ID>","project_directory":"<current project's absolute repository root>","browser_validation":<browser_validation>}
JSON
```

Success: `{ "status": "prepared", "sandbox_context": SandboxContext }`.
Failure: `{ "status": "failed", "stage": string, "reason": string,
"sandbox_context"?: SandboxContext }`, with exit code 1. Stages are `input`,
`preflight`, `worktrees`, `docker`, or `ports`.

Carry any returned `sandbox_context` unchanged to teardown, including after
failure.

Return the command's JSON result unchanged and end this workflow.
