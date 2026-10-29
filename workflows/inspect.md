# Inspect

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../goals/inspect-complete.md ../templates/delivery-context.md
```

---

## Input

| Entry | Input |
| --- | --- |
| `/ready` | `delivery-context` |

Stop before routing when a required caller handoff is missing or incomplete.

---

## Branch Routing

Select exactly one branch:

| Situation | Workflow |
| --- | --- |
| Caller supplies `delivery-context` | `./inspect-item.md` |
| No caller handoff | `./inspect-standalone.md` |

Read the selected workflow file completely and follow it.
