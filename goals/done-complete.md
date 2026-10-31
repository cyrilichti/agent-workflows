# Done Complete

## Outcome

One exact request is merged and its official item is done, or the workflow
stops with the exact observed blocker.

## Terminal Outcomes

- Complete: the exact request is observed as merged and its official item is
  observed as done.
- Stopped: the exact observed blocker is returned without claiming an
  unobserved change.
- Partial: the request is observed as merged but the item is not observed as
  done; report the remaining item action or verification.
- Every outcome identifies both records and their observed results.
