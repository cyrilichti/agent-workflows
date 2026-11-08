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

On `not_found`, ask for a better reference or search phrase and repeat. On
`ambiguous`, ask with `../templates/select-option.md` using each candidate's
title, status, and destination as its label and `item_id` as its value. Rerun
the command with the selected ID as the positional `item`. On failure, report
`stage` and `reason`, then stop. Use only the final `resolved` provider and
item as official context.

Set `item_id` to the resolved official item's ID. Read the approved plan in the
resolved item's comments. Stop if no approved plan comment is available. Set
`container_execution` only when the plan requires running project code or
services in a container and the current project has a Docker Compose
configuration. Otherwise, use `false`; preparation still creates the project
worktree.

Set `dependency_directories` to `[]` when `container_execution` is `false`.
Otherwise, read the current project's README and identify its local repository
dependencies. Set `repository_names_json` to a JSON array of their names, then
resolve them together from this file's directory:

```sh
node ../commands/resolve-local-repository-dependencies.ts "$repository_names_json"
```

Read the README of each resolved repository and repeat for any dependencies it
names. Stop when no new repositories remain. Set `dependency_directories` to
the distinct absolute paths found, excluding the current project. If any name
returns `not found`, `ambiguous`, or `search incomplete`, or the command fails,
report the issue and stop.

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
