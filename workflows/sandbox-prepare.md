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

Set `item_id` to the resolved official item's ID. Read the approved plan in the
resolved item's comments. Stop if no approved plan comment is available. Set
`container_execution` only when the plan requires running project code or
services in a container, the current project has a Docker Compose configuration,
and Docker and sbx are available. Otherwise, use `false` and an empty
`dependency_directories` array; preparation still creates the project worktree.

Only when `container_execution` is `true`, read the current project's README.
Identify the required local repositories named in it. Resolve their names
together from this file's directory. Send one JSON array containing the exact
repository names found in the README on stdin:

```sh
node ../commands/resolve-local-repository-dependencies.ts
```

Require a returned `path` for each name. On `not found`, `ambiguous`,
`search incomplete`, or a command error, report it and stop. Read each located
repository's README for further repository names and resolve any new names
together. Set `dependency_directories` to the distinct returned absolute paths,
excluding the current project. Otherwise, set it to `[]`.

Invoke preparation from this file's directory with the resolved and derived values:

```sh
node ../commands/sandbox-prepare.ts <<'JSON'
{"item_id":"<resolved item ID>","project_directory":"<current project's absolute repository root>","dependency_directories":<absolute dependency repository roots as JSON array>,"container_execution":<container_execution>}
JSON
```

Success: `{ "status": "prepared", "sandbox_context": SandboxContext }`.
Failure: `{ "status": "failed", "stage": string, "reason": string,
"sandbox_context"?: SandboxContext }`, with exit code 1. Stages are `input`,
`preflight`, `worktrees`, `docker`, or `ports`.

Return the command's JSON result unchanged and end this workflow.
