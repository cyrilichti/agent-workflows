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
| `item` | Optional item ID, native URL, title, or search phrase for creation. |
| `sandbox_context` | Required context returned by preparation for teardown. |
| `disk_size` | Optional positive integer in GB for the Docker data disk when creating a sandbox; defaults to 10. |

When neither input is supplied, ask for an item ID, native URL, title, or search
phrase before routing.

## Branch Routing

Select exactly one branch:

| Situation | Workflow |
| --- | --- |
| Caller supplies `sandbox_context` | `./sandbox-teardown.md` |
| Otherwise, caller supplies `item` | `./sandbox-create.md` |

Read the selected workflow file completely and follow it.
