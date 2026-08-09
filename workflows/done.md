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

- follow `./done-confirm.md` when the caller supplies one complete
  `completion_context` following `../templates/done-context.md`, with
  `entry_mode: caller`;
- otherwise, follow `./done-standalone.md`.

Fail an explicit but incomplete caller handoff instead of switching it to
standalone mode.

---

## Safety

- Never mutate before the single explicit confirmation.
- Merge only the exact unchanged, non-draft, mergeable request using `squash`.
- Transition only the item status and only after observing the merge; never
  retry or roll back automatically.
- Never modify work or request content, deploy, release, tag, or invoke another
  workflow.
