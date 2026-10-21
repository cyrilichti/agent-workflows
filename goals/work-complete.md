# Work Complete

## Outcome

One authoritative plan is initialized or resumed as required and executed
autonomously.

## Terminal Outcomes

- Completed: the authoritative plan has no `pending` or `in_progress` todo,
  at least one todo is `completed`, and `/work` stops.
- Cancelled: every todo is `cancelled`; no work is reported as completed and
  `/ready` is not invoked.
- Stopped: the exact failed operation or unmet precondition is reported without
  claiming an unobserved change.
