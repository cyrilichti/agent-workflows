# Refine

## Purpose

Decompose one oversized official item into confirmed provider-backed child
items without changing the parent.

---

## Required Context

Load `../goals/refine-complete.md` once as this workflow's completion contract.

Reuse these rules when already active from the caller; otherwise follow them:

- `../rules/user-facing-output.md`;
- `../rules/mutation-response.md`.

---

## Steps

### 1. Follow One Context Branch

Follow exactly one branch:

- follow `./refine-item.md` when the caller supplies a resolved provider, the
  complete official parent item, and `needs-refinement` findings;
- otherwise, follow `./refine-standalone.md`.

Fail an explicit but incomplete caller handoff instead of switching it to
standalone mode.

---

## Safety

- Do not treat pasted or inferred metadata as an official parent item.
- Do not change the official parent item.
