# Work

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../rules/change-design.md ../goals/work-complete.md ../templates/delivery-context.md
```

---

## Delivery Context

For a return from `/ready` or `/inspect`, require a conforming delivery context
before routing; otherwise stop.

---

## Steps

### 1. Follow One Context Branch

Select exactly one branch:

| Situation | Workflow |
| --- | --- |
| Caller supplies an approved plan and its complete official item context | `./work-item.md` |
| No caller handoff | `./work-standalone.md` |

Both branches create or preserve a delivery context conforming to `Delivery Context`.

Treat a caller handoff from `/ready` or `/inspect` with a complete delivery
context as `resumed`. Treat the approved plan and item supplied by `/pick` as
`new`.

Read the selected workflow file completely and follow it.

---

## Safety

- The selected approved plan and official item, or complete caller handoff,
  authorize autonomous execution.
