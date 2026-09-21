# Ready Complete

## Outcome

Completed work is checked directly against its plan, repaired through `/work`
when necessary, then promoted and handed to `/inspect` autonomously.

## Success Criteria

- The authoritative plan is terminal and has completed work.
- The current work branch is clean, has a safe upstream state, and remains
  unchanged through its planned global validation.
- The complete branch diff is coherent with the plan's Objective and Expected
  Outcome without performing an independent code review.
- Concrete delivery gaps return to resumed `/work` with stable finding IDs,
  exact explanations, and the verified HEAD SHA.
- Passing work pushes only when needed, creates or updates one complete plan
  comment, removes the leading `Draft:` title prefix, applies the exact request
  body, removes draft state, and attempts the item review transition.
- Every required request mutation is observed before `/inspect` receives the
  same delivery context.

## Stop Conditions

- Stop only for an exact operational blocker. Delivery gaps continue through
  `/work`; successful promotion continues through `/inspect`.

## Human Validation

The standalone plan, item, and exact-request selections, or a complete caller
handoff, authorize readiness. No promotion confirmation is required.
