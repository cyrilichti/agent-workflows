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
dependencies. The resolver only locates those repositories on disk; it does
not decide which repositories the project needs. Send all identified names in
one JSON array from this file's directory:

```sh
node ../commands/resolve-local-repository-dependencies.ts <<'JSON'
["<first dependency repository>", "<second dependency repository>"]
JSON
```

Add each returned `path` to `dependency_directories`, except the current
project or a path already added. Read the README at each newly added path and
resolve any dependency names that have not been sent to the resolver before.
Repeat until no new names remain. Skip the command when there are none. If any
name returns `not found`, `ambiguous`, or `search incomplete`, or the command
fails, report the issue and stop.

Invoke preparation from this file's directory with the resolved and derived values:

```sh
node ../commands/sandbox-prepare.ts <<'JSON'
{"item_id":"<resolved item ID>","project_directory":"<current project's absolute repository root>","dependency_directories":<dependency_directories>,"container_execution":<container_execution>}
JSON
```

Read the command's JSON output as `sandbox_result`. Set `sandbox_context` to
`sandbox_result.sandbox_context` when present, including after failure. A
prepared result has `status: prepared`; failure has `status: failed`, `stage`,
and `reason`, with exit code 1. Failure stages are `input`, `preflight`,
`worktrees`, `docker`, and `ports`.

Return `sandbox_result` unchanged. To remove its resources later, invoke
`/sandbox` with the retained `sandbox_context`; that call routes to teardown.
