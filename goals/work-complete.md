# Work Complete

## Outcome

Execute one authoritative plan in `new` or `resumed` mode, maintaining its
`Delivery Context`.

## Terminal Outcomes

- Continued: no todo is `pending` or `in_progress`, at least one is `completed`,
  and the current `Delivery Context` is passed to `/ready`.
- Cancelled: every todo is `cancelled`; report no completed work and do not
  invoke `/ready`.
- Stopped: report the exact failed operation or unmet precondition without
  claiming an unobserved change.
