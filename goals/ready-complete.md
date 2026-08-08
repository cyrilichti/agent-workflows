# Ready Complete

## Outcome

Completed work is checked directly against its plan, then either left
unchanged or promoted for human review after one explicit confirmation.

## Success Criteria

- The authoritative plan is terminal and has completed work.
- The current work branch is clean, has a safe upstream state, and remains
  unchanged through its planned global validation.
- The complete branch diff is coherent with the plan's Objective and Expected
  Outcome without performing an independent code review.
- The user sees one concise promotion proposal before any mutation.
- Confirmed promotion pushes only when needed, applies the exact request body,
  removes draft state, and reports the best-effort item review transition.
- The workflow stops without invoking `/review`.

## Stop Conditions

- Stop successfully when the user declines promotion or promotion completes.
- Stop and report concrete `/work` findings or an exact operational blocker.

## Human Validation

Require one explicit confirmation of the complete promotion proposal before
the push or any provider mutation.
