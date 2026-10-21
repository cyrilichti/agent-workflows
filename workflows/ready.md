# Ready

## Purpose

Verify completed work against its plan, repair gaps through `/work`, then
promote it and continue through `/inspect` autonomously.

---

## Required Context

Reuse any rules already active from the caller. From this workflow's directory,
load the remaining rules in one `cat` command, omitting paths for active rules.
Skip the command when all are active:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md
```

Load `../goals/ready-complete.md` once as this workflow's completion contract.

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

- The standalone plan, item, and exact-request selections, or a complete caller
  handoff, authorize readiness and promotion without another confirmation.
- `/ready` may modify the authoritative plan only as needed for its readiness
  activity. `/work` remains responsible for code changes, corrective todo
  execution, and commits.
- Do not force-push, merge, deploy, release, or run unplanned checks.
- Invoke `/inspect` only after every required promotion mutation is observed.
