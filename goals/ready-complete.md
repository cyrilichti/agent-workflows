# Ready Complete

## Outcome

Completed work is checked directly against its plan, repaired through `/work`
when necessary, then promoted and handed to `/inspect` autonomously.

## Terminal Outcomes

- Corrective: every concrete delivery gap is bound to a stable finding ID, its
  exact explanation, and the verified HEAD SHA before the same delivery
  context returns to resumed `/work`.
- Promoted: the planned validation passed, the exact authoritative plan is the
  request body, the request is observed open and non-draft at the verified
  HEAD, and the same delivery context is handed to `/inspect` after the item
  review transition was attempted.
- Stopped: the exact operational blocker is reported without treating a
  delivery gap as terminal or claiming an unobserved promotion.
