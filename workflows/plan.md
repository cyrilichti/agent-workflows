# Plan

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../goals/plan-complete.md
```

---

## Input

| Entry | Input |
| --- | --- |
| `/pick` | `entry_mode: workflow`, `provider`: resolved item provider, `item`: official item context |
| Standalone | Request context, optionally including an official item ID, native URL, or title |

Stop before routing when any part of a caller handoff is missing or incomplete.
Use `standalone` entry mode when no caller handoff is supplied.

---

## Branch Routing

Select exactly one branch:

| Situation | Workflow |
| --- | --- |
| Caller supplies `provider` and `item` | `./plan-item.md` |
| Standalone request identifies an existing official item | `./plan-item.md` |
| Standalone request describes work without identifying an item | `./plan-standalone.md` |

For a standalone official-item request, resolve the item with
`../commands/resolve-existing-item.md` using its ID or native URL as
`reference`, or its title as `query`. Preserve the returned provider and
official item context. A quoted title that is the object of the plan request
is an item query.

Read the selected workflow file completely and follow it. In `workflow` mode,
return the branch result to the caller; in `standalone` mode, report it.
