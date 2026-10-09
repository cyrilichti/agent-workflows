# Done Complete

## Outcome

One exact request is merged and its official item is done, or the workflow
stops with the exact observed blocker or declined mutation.

## Terminal Outcomes

- Complete: the exact request is observed as merged and its official item is
  observed as done.
- Stopped: the exact observed blocker or declined completion is returned
  without claiming an unobserved change.
- Partial: when the request is observed as merged but the item cannot be moved
  to done, the item transition is the only remaining action.
- Every outcome identifies both records and their observed results.
