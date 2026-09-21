# Ready

## Purpose

Verify completed work against its plan, repair gaps through `/work`, then
promote it and continue through `/inspect` autonomously.

---

## Required Context

Load `../goals/ready-complete.md` once as this workflow's completion contract.

Reuse these rules when already active from the caller; otherwise follow them:

- `../rules/user-facing-output.md`;
- `../rules/mutation-response.md`;
- `../rules/validation-execution.md`.

---

## Steps

### 1. Follow One Context Branch

Follow exactly one branch:

- follow `./ready-confirm.md` when the caller supplies a complete delivery
  context with an authoritative plan;
- otherwise, follow `./ready-standalone.md`.

Preserve every identity supplied by the caller. Fail an incomplete caller
handoff instead of switching it to standalone mode.

---

## Safety

- Only `/work` may modify the plan, code, or commits.
- Do not force-push, merge, deploy, release, or run unplanned checks.
- Invoke `/inspect` only after every required promotion mutation is observed.
