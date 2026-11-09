# Sandbox Create

## Input

| Input | Description |
| --- | --- |
| `item` | Required item ID, native URL, title, or search phrase. |
| `disk_size` | Optional positive integer in GB for the Docker data disk; defaults to 10. |

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
resolved item's comments. Stop if no approved plan comment is available. Read
its `## Validation` checks and determine whether completing them requires the
project or its services to be running. Set `is_docker_enabled` to `true` when
execution is needed and the current project has a Docker Compose
configuration. Otherwise, set it to `false`; preparation still creates the
project worktree.

Set `dependency_directories` to `[]` when `is_docker_enabled` is `false`.
Otherwise, read the current project's README and collect the exact repository
names it lists as dependencies. From this file's directory, pass all of those
names as one JSON array in the named argument:

```sh
node ../commands/resolve-local-repository-dependencies.ts --repository-names '<JSON array of repository names from README>'
```

Add each returned `path` to `dependency_directories`, except the current
project or a path already added. Read the README at each newly added path and
resolve any dependency names that have not been sent to the resolver before.
Repeat until no new names remain. Skip the command when there are none. If any
name returns `not found`, `ambiguous`, or `search incomplete`, or the command
fails, report the issue and stop.

Set `disk_size` to the supplied positive integer, or `10` if absent:

```sh
DOCKER_SANDBOXES_DOCKER_SIZE="<disk_size>g" node ../commands/sandbox-create.ts <<'JSON'
{"item_id":"<resolved item ID>","project_directory":"<current project's absolute repository root>","dependency_directories":<dependency_directories>,"is_docker_enabled":<is_docker_enabled>}
JSON
```

Read the command's JSON result. On failure, report its `stage` and `reason`.
Return the result unchanged and end this workflow.
