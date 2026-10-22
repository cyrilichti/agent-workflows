# Work

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../rules/change-design.md ../goals/work-complete.md ../templates/delivery-context.md
```

---

## Delivery Context

Use `../templates/delivery-context.md` as the structure for `delivery_context`.
When the caller supplies `item`, pass that exact official item context to the
selected branch unchanged.

A return from `/ready` or `/inspect` must supply `delivery_context` with `plan`,
`item`, `branch`, `request`, and at least one `source_findings` record in the
template's format. Report any missing field and stop before routing; do not
treat the return as a standalone call.

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
