# Ready

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../goals/ready-complete.md
```

---

## Input

| Entry | Input |
| --- | --- |
| `/work` | `delivery-context`: complete context with `plan`, `item`, `branch`, and `request` |
| Standalone `/ready` | `item`: official item ID, native URL, title, or search phrase |

Stop before routing when a required caller handoff is missing or incomplete.

---

## Branch Routing

Select exactly one branch:

| Situation | Workflow |
| --- | --- |
| Caller supplies `delivery-context` | `./ready-item.md` |
| No caller handoff | `./ready-standalone.md` |

Read the selected workflow file completely and follow it.
