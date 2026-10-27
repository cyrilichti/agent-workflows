# Work

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../rules/change-design.md ../goals/work-complete.md ../templates/delivery-context.md
```

---

## Input

| Entry | Input |
| --- | --- |
| `/pick` | `plan`: approved plan; `item`: complete official item context |
| `/ready` or `/inspect` | `delivery-context`: conforming `Delivery Context` with `branch` and `request` |
| Standalone `/work` | No caller handoff required |

Stop before routing when a required input for the caller handoff is missing or
incomplete.

---

## Work Mode

Set `work_mode` from the caller handoff:

| Handoff | `work_mode` |
| --- | --- |
| `plan` and `item` | `new` |
| `delivery-context` | `resumed` |

---

## Branch Routing

Select exactly one branch:

| Situation | Workflow |
| --- | --- |
| Caller supplies `plan` and `item`, or `delivery-context` | `./work-item.md` |
| No caller handoff | `./work-standalone.md` |

Both branches create or preserve a `Delivery Context`.

Read the selected workflow file completely and follow it. For
`./work-standalone.md`, pass:

```text
reference: user-supplied item ID or native URL, when available
query: user-supplied item title or search phrase, when available
```
