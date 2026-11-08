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

Set `item_id` to the resolved official item's ID. Read its authoritative plan:
use the local plan referenced by a linked request when present, otherwise the
approved plan in the item's comments. Stop if no plan is available. Set
`container_execution` to whether the plan requires running project code or
services in a container. If it does, require a Docker Compose configuration in
the current project; report a missing configuration and stop.

Read the current project's README. Identify required local repository dependencies
from the service and repository names it specifies.
For each name, locate its repository from this file's directory:

```sh
node ../commands/resolve-local-project-directory.ts "<service or repository name>" "<resolved item ID>"
```

Require a returned `path` that matches the identified dependency. On `not found`,
`search incomplete`, an error, or an unclear match, report it and stop. Read
each located repository's README for further dependencies and repeat. Set
`dependency_directories` to the distinct returned absolute paths, excluding the
current project.

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
