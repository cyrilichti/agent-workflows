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

## Branch Routing

Select exactly one branch:

| Situation | Workflow |
| --- | --- |
| Caller supplies `sandbox_context` | `./sandbox-teardown.md` |
| Otherwise, caller supplies `item` | `./sandbox-prepare.md` |

Stop with an input error when neither input is supplied. Read the selected
workflow file completely and follow it.
