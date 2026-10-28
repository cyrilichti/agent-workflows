# Ready Complete

## Outcome

An existing plan with every todo completed and every global validation checked
is published unchanged on its exact request, which is then made ready for
inspection.

## Terminal Outcomes

- Promoted: the complete local plan is sent as the request description, the
  request is marked ready, and the same `delivery-context` is handed to
  `/inspect` after successful provider operations.
- Stopped: a missing or ineligible plan, inconsistent identity, unsafe Git
  state, or failed mutation is reported without claiming promotion.
