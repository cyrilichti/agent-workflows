# Ready Complete

## Outcome

An existing plan with no pending or in-progress todo, at least one completed
todo, and every global validation checked
is published unchanged on its exact request, which is then made ready for
inspection.

## Terminal Outcomes

- Promoted: the request contains the complete local plan and is marked ready.
  The delivery context carries the observed published request to `/inspect`.
- Stopped: a failure that could not be recovered is reported with the observed
  state and the remaining action or decision.
