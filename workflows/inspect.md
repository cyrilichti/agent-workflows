# Inspect

## Purpose

Independently inspect one exact open request snapshot, publish every valid
finding, and either return blocking findings to `/work` or apply the final
inspection label.

---

## Required Context

Load `../goals/inspect-complete.md` once as this workflow's completion contract.

Reuse these rules when already active from the caller; otherwise follow them:

- `../rules/user-facing-output.md`;
- `../rules/mutation-response.md`;
- `../rules/validation-execution.md`.

---

## Steps

Follow exactly one branch:

- when the caller supplies a complete `../templates/delivery-context.md`,
  preserve every identity and follow `./inspect-execute.md`;
- otherwise, follow `./inspect-standalone.md`.

Fail an incomplete caller handoff instead of switching it to standalone mode.
