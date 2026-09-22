# Plan Complete

## Outcome

One task context produces an approved plan or `needs-refinement`.

## Success Criteria

- An approved plan follows `../templates/plan.md`, is persisted under
  `../plans/` only after approval,
  uses its project-relative file path as its canonical reference, has no
  unresolved material question, and has explicit user approval after its
  complete content and autonomous-delivery scope were shown.
- A `needs-refinement` result contains concise findings and creates no plan
  file.
- Adjustment before a later approval, abandonment, missing-author, and failure
  outcomes create no plan file.

## Stop Conditions

- Stop successfully after returning or reporting either valid outcome.
- Stop and report when a required operation fails.
