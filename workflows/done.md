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

- After confirmation, mutate only the exact request and its item as defined by
  the completion branch.
- Never modify work or request content, deploy, release, tag, retry, roll back,
  or invoke another workflow.
