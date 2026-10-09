# Done

## Purpose

Merge one exact request when needed, then move its official item to the
resolved `done` state.

---

## Required Context

Load `../goals/done-complete.md` once as this workflow's completion contract.

Reuse these rules when already active from the caller; otherwise follow them:

- `../rules/user-facing-output.md`;
- `../rules/mutation-response.md`.

---

## Steps

### 1. Follow One Context Branch

Follow exactly one branch:

- follow `./done-confirm.md` when the caller supplies a `completion_context`,
  with `entry_mode: caller`;
- otherwise, follow `./done-standalone.md`.

The selected branch owns validation of its input context. Never switch an
explicit caller handoff to standalone mode.
