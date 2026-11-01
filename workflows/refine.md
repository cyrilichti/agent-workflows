# Refine

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../goals/refine-complete.md
```

---

## Input

| Entry | Input |
| --- | --- |
| `/pick` | `provider`: resolved item provider; `parent_item`: complete official parent item; `needs_refinement_findings`: exact findings from `/plan` |
| Standalone | Parent item ID, native URL, title, or search phrase when supplied |

Stop before routing when any part of a caller handoff is missing or incomplete.

---

## Branch Routing

Select exactly one branch:

| Situation | Workflow |
| --- | --- |
| Caller supplies `provider`, `parent_item`, and `needs_refinement_findings` | `./refine-item.md` |
| No caller handoff | `./refine-standalone.md` |

Read the selected workflow file completely and follow it.
