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

- follow `./done-confirm.md` when the caller supplies the resolved item
  provider, complete official item, resolved version provider, repository, and
  exact request with complete delivery state;
- otherwise, follow `./done-standalone.md`.

Fail an explicit but incomplete caller handoff instead of switching it to
standalone mode.

---

## Safety

- Never mutate before the single explicit confirmation.
- Never merge a Draft, blocked, unknown, changed-head, or substituted request.
- Never transition the item before the request is observed as merged.
- Never retry automatically or roll back a successful merge.
- Never modify code, commits, branches, request content, reviews, or item
  fields other than the resolved state.
- Never deploy, release, tag, or invoke another workflow.
