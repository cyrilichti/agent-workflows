# Plan Complete

## Outcome

One task context produces an approved plan or `needs-refinement`.

## Success Criteria

- An approved plan follows `../templates/plan.md`, exists under `../plans/`,
  uses its project-relative file path as its canonical reference, and has
  no unresolved material question and has explicit user approval after its
  complete content and the current mode's approval scope were shown.
- Standalone approval authorizes only completing `/plan`; it does not start
  delivery. Workflow approval returns the plan to its caller with autonomous
  delivery authorized.
- For an official item, only an approved plan is published in its dedicated
  comment. A successful mutation response identifies the created comment before
  `agent-planned` is applied; a failed or inconclusive response stops first.
- A `needs-refinement` result contains concise findings, returns through the
  official-item branch unchanged, and creates no plan file, plan comment, or
  label mutation.
- The plan-reading operation remains available for workflows that retrieve a
  previously published plan; publication does not use it as a readback.

## Stop Conditions

- Stop successfully after returning or reporting either valid outcome.
- Stop and report when a required operation fails.
