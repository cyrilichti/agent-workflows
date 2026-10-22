# Work

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../rules/change-design.md ../goals/work-complete.md
```

---

## Steps

### 1. Follow One Context Branch

Select exactly one branch, read its file completely, then follow it:

- follow `./work-item.md` when the caller supplies an approved plan and its
  complete `agent-planned` official item context;
- otherwise, follow `./work-standalone.md`.

Preserve complete official item context when the caller supplies it. Both
branches create or preserve `../templates/delivery-context.md`. Fail an
incomplete caller handoff instead of switching it to standalone mode.

Treat a caller handoff from `/ready` or `/inspect` with a complete delivery
context as `resumed`. Treat the approved plan and item supplied by `/pick` as
`new`.

---

## Safety

- The selected approved plan and official item, or complete caller handoff,
  authorize autonomous execution.
