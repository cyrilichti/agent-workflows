# Work

## Purpose

Execute one selected plan autonomously and stop when its todos are terminal.

---

## Required Context

Load `../goals/work-complete.md` once as this workflow's completion contract.

Reuse these rules when already active from the caller; otherwise follow them:

- `../rules/user-facing-output.md`;
- `../rules/mutation-response.md`;
- `../rules/change-design.md`.

---

## Steps

### 1. Follow One Context Branch

Follow exactly one branch:

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
  authorize autonomous execution. Do not ask for a todo commit confirmation.
- Push each non-empty todo commit normally to the current branch upstream.
- Do not invoke `/ready` or `/inspect` from `/work`.
