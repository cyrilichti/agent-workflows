# Work

## Purpose

Execute one selected plan incrementally, then offer completed work to `/ready`.

---

## Required Context

Load `../goals/work-complete.md` once as this workflow's completion contract.

Reuse these rules when already active from the caller; otherwise follow them:

- `../rules/user-facing-output.md`;
- `../rules/mutation-response.md`.

---

## Steps

### 1. Follow One Context Branch

Follow exactly one branch:

- follow `./work-item.md` when the caller supplies an approved plan and its
  complete official item context;
- otherwise, follow `./work-standalone.md`.

Preserve complete official item context when the caller supplies it. Fail an
explicit but incomplete caller handoff instead of switching it to standalone
mode.

---

## Safety

- Do not change item status.
- Do not push completed todo commits or invoke `/review`.
