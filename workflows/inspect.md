# Inspect

## Purpose

Independently inspect one exact open request snapshot, publish every valid
finding, and either return blocking findings to `/work` or apply the final
inspection label and transition the item to review.

---

## Required Context

Reuse any rules already active from the caller. From this workflow's directory,
load the remaining rules in one `cat` command, omitting paths for active rules.
Skip the command when all are active:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md
```

Load `../goals/inspect-complete.md` once as this workflow's completion contract.
Load `../templates/inspect-result.md` once as its terminal response contract.

---

## Steps

Follow exactly one branch:

- when the caller supplies a complete `../templates/delivery-context.md`,
  preserve every identity and follow `./inspect-execute.md`;
- otherwise, follow `./inspect-standalone.md`.

Fail an incomplete caller handoff instead of switching it to standalone mode.

---

## Safety

- The standalone plan, item, and request selections, or a complete caller
  handoff, authorize inspection and publication without finding curation or
  publication confirmation. A standalone caller must already possess the
  ignored plan file.
- Do not invoke `/done`.
