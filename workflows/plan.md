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
| Standalone | `intention`: planning request; optional `item`: official item ID, native URL, title, or search phrase |

Stop before routing when any part of a caller handoff is missing or incomplete.
Use `standalone` entry mode when no caller handoff is supplied.

---

## Resolve a Standalone Official Item

When the intention explicitly identifies an existing official item, run from
this file's directory. For an ID or native URL:

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
with the selected ID as the positional `item`. On failure, report `stage` and
`reason`, then stop. Use only the final `resolved` provider and item as
official context. Treat a quoted title supplied as the object of the plan
request as an explicit item query. Do not search when the intention only
describes work.

## Branch Routing

Select exactly one branch:

| Situation | Workflow |
| --- | --- |
| Caller supplies `provider` and `item`, or standalone resolution returns them | `./plan-item.md` |
| Standalone intention describes work without identifying an item | `./plan-standalone.md` |

Read the selected workflow file completely and follow it. In `workflow` mode,
return the branch result to the caller; in `standalone` mode, report it.
