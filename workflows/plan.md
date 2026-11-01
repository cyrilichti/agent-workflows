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

For a standalone official-item request, run from this file's directory:

```sh
node ../commands/resolve-existing-item.ts "<item ID or native URL>"
```

For a title, use `node ../commands/resolve-existing-item.ts --query "<title>"`.
On `not_found` or `ambiguous`, ask for a better reference or select a returned
candidate with `../templates/select-option.md`, then rerun with its ID. On
failure, report `stage` and `reason` and stop. Preserve only the final
`resolved` provider and item as official context. A quoted title that is the
object of the plan request is an item query.

Read the selected workflow file completely and follow it. In `workflow` mode,
return the branch result to the caller; in `standalone` mode, report it.
