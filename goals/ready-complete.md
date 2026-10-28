# Ready Complete

## Outcome

An existing plan with every todo completed and every global validation checked
is published unchanged on its exact request, which is then made ready for
inspection.

## Terminal Outcomes

- Promoted: the request body matches the complete local plan ignoring only
  trailing CR/LF characters, and the request is observed open and non-draft at
  the verified HEAD before the same `delivery-context` is handed to `/inspect`.
- Stopped: a missing or ineligible plan, inconsistent identity, unsafe Git
  state, failed mutation, or unobserved postcondition is reported without
  claiming promotion.
