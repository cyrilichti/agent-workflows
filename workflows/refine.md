# Refine

## Purpose

Decompose one oversized official item into confirmed provider-backed child
items without changing the parent.

---

## Required Context

Reuse any rules already active from the caller. From this workflow's directory,
load the remaining rules in one `cat` command, omitting paths for active rules.
Skip the command when all are active:

```sh
cat ../rules/default-language.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md
```

Load `../goals/refine-complete.md` once as this workflow's completion contract.

---

## Steps

### 1. Follow One Context Branch

Follow exactly one branch:

- follow `./refine-item.md` when the caller supplies a resolved provider, the
  complete official parent item, and `needs-refinement` findings;
- otherwise, follow `./refine-standalone.md`.

Fail an explicit but incomplete caller handoff instead of switching it to
standalone mode.
