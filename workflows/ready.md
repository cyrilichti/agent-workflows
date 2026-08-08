# Ready

## Purpose

Verify completed work against its plan, then offer and perform promotion for
human review.

---

## Required Context

Load `../goals/ready-complete.md` once as this workflow's completion contract.

Reuse these rules when already active from the caller; otherwise follow them:

- `../rules/user-facing-output.md`;
- `../rules/mutation-response.md`.

---

## Steps

### 1. Follow One Context Branch

Follow exactly one branch:

- follow `./ready-confirm.md` when the caller supplies an authoritative plan;
- otherwise, follow `./ready-standalone.md`.

Preserve the optional complete official item context and request ID supplied by
the caller. Fail an explicit but incomplete caller handoff instead of switching
it to standalone mode.

---

## Safety

- Do not modify the plan, code, commits, or item content.
- Do not force-push, merge, deploy, release, run extra checks, or invoke
  `/review`.
