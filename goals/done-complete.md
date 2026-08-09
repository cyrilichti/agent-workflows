# Done Complete

## Outcome

One exact non-draft request is observed as merged and its official item is in
the uniquely resolved `done` state after one explicit completion confirmation
when mutations remain.

## Success Criteria

- The request belongs to the configured version provider and repository and is
  either resolved from the official item's backlinks or an exact user-supplied
  request ID in standalone mode, or preserved in one complete compact caller
  context.
- An open request is mergeable at the exact confirmed head SHA before the
  merge is attempted.
- An open request is merged using `squash`.
- The request is observed as merged before the official item transition is
  attempted.
- The official item is transitioned or already in its uniquely resolved
  `done` state.
- Every attempted mutation and its observed result are reported through
  `../templates/done-result.md`.
- The workflow stops without invoking another workflow.

## Stop Conditions

- Stop successfully when the request and item are already complete, the user
  declines completion, or every success criterion is satisfied.
- Stop and report an exact resolution, eligibility, stale-confirmation,
  provider, or mutation blocker.
- After an observed merge and failed item transition, report only that
  transition as the remaining action for an explicit rerun.

## Human Validation

Require one explicit confirmation of the complete mutation preview unless the
request is already merged and the item is already done.
