# Work

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../rules/change-design.md ../goals/work-complete.md ../templates/delivery-context.md
```

---

## Delivery Context

`../templates/delivery-context.md` defines the expected delivery context
structure. Preserve complete official item context supplied by the caller.

A return from `/ready` or `/inspect` must supply a complete delivery context.
Stop when it is missing or incomplete; do not route the return to standalone.

---

## Steps

### 1. Follow One Context Branch

Select exactly one branch:

| Situation | Workflow |
| --- | --- |
| Caller supplies an approved plan and its complete `agent-planned` official item context | `./work-item.md` |
| No caller handoff | `./work-standalone.md` |

Both branches create or preserve a delivery context following
`../templates/delivery-context.md`.

Treat a caller handoff from `/ready` or `/inspect` with a complete delivery
context as `resumed`. Treat the approved plan and item supplied by `/pick` as
`new`.

Read the selected workflow file completely and follow it.

---

## Safety

- The selected approved plan and official item, or complete caller handoff,
  authorize autonomous execution.
