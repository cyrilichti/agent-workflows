# Done

## Purpose

Merge one exact request when needed, then move its official item to the
resolved `done` state.

---

## Required Context

Reuse any rules already active from the caller. From this workflow's directory,
load the remaining rules in one `cat` command, omitting paths for active rules.
Skip the command when all are active:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md
```

Load `../goals/done-complete.md` once as this workflow's completion contract.

---

## Steps

### 1. Follow One Context Branch

Follow exactly one branch:

- follow `./done-confirm.md` when the caller supplies a `completion_context`,
  with `entry_mode: caller`;
- otherwise, follow `./done-standalone.md`.

The selected branch owns validation of its input context. Never switch an
explicit caller handoff to standalone mode.
