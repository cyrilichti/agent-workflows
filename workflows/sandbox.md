# Sandbox

## Required Context

Reuse active files. From this file's directory, read the remaining files below
together in one `cat`, omitting active paths; skip when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/user-facing-output.md ../goals/sandbox-complete.md
```

## Input

| Input | Description |
| --- | --- |
| `item` | Required item ID, native URL, title, or search phrase for preparation. |
| `sandbox_context` | When supplied, select teardown instead of preparation. |

## Steps

### 1. Select Mode

Use teardown when `sandbox_context` is supplied; otherwise use preparation.
Stop with an input error when the selected mode's required input is missing.

### 2. Run the Selected Command

Run the command from this file's directory using the selected mode's JSON input
on stdin. Return its JSON result unchanged and end this workflow.

`SandboxContext` is the serializable ownership record defined in
`../commands/sandbox-context.ts`. Carry the returned object unchanged from
preparation to teardown, including after failure, so cleanup can be retried.

#### Preparation

Use the current project's absolute repository root as `project_directory`.
Capture it before running commands from this file's directory.

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
Set `browser_validation` to that decision. Derive the project path and validation
flag here rather than requesting them from the caller.

Invoke preparation from this file's directory:

```sh
node ../commands/sandbox-prepare.ts <<'JSON'
{"item_id":"<item ID>","project_directory":"<absolute project path>","browser_validation":false}
JSON
```

Replace the example with the resolved and derived values. Input is exactly one JSON object
on stdin. The command checks prerequisites before creating worktrees, resolves
README and Compose dependencies through the shared `/project` resolver without
tie breaking, copies ignored resources, and starts Docker services when browser
validation is planned.

Success: `{ "status": "prepared", "sandbox_context": SandboxContext }`.
Failure: `{ "status": "failed", "stage": string, "reason": string,
"sandbox_context"?: SandboxContext }`, with exit code 1. Stages are `input`,
`preflight`, `worktrees`, `docker`, or `ports`. A failure after allocation attempts
rollback and includes the context for cleanup retry when rollback is incomplete.

#### Teardown

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
