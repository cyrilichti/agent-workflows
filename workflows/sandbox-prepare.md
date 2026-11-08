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

Read the current project's README and effective Compose configuration, if present.
Identify required local repository dependencies from the service and repository
names in that evidence.
For each name, locate its repository from this file's directory:

```sh
node ../commands/resolve-local-project-directory.ts "<service or repository name>" "<resolved item ID>"
```

Require a returned `path` that matches the identified dependency. On `not found`,
`search incomplete`, an error, or an unclear match, report it and stop. Inspect
each located repository's README and Compose configuration for further dependencies
and repeat. Set `dependency_directories` to the distinct returned absolute paths,
excluding the current project.

Invoke preparation from this file's directory with the resolved and derived values:

```sh
node ../commands/sandbox-prepare.ts <<'JSON'
{"item_id":"<resolved item ID>","project_directory":"<current project's absolute repository root>","dependency_directories":<absolute dependency repository roots as JSON array>,"browser_validation":<browser_validation>}
JSON
```

Success: `{ "status": "prepared", "sandbox_context": SandboxContext }`.
Failure: `{ "status": "failed", "stage": string, "reason": string,
"sandbox_context"?: SandboxContext }`, with exit code 1. Stages are `input`,
`preflight`, `worktrees`, `docker`, or `ports`.

Return the command's JSON result unchanged and end this workflow.
