# Plan Complete

## Outcome

One task context produces an approved plan or `needs-refinement`.

## Terminal Outcomes

- Approved: the plan follows `../templates/plan.md`, has no unresolved material
  question, exists under `../plans/` at its canonical project-relative path,
  and has explicit approval for the current entry mode. For an official item,
  its dedicated publication and `agent-planned` label are observed before the
  plan returns.
- Needs refinement: concise findings return without a plan file, plan comment,
  label mutation, or change to the official item context.
- Stopped: a required operation failure is reported without claiming an
  approved or published plan.
