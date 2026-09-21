# Done Complete

## Outcome

One exact request is merged and its official item is done, or the workflow
stops with the exact observed blocker or declined mutation.

## Success Criteria

- Context comes from standalone resolution or one valid caller packet.
- The current official item has the exact `agent-inspected` label before any
  completion preflight or mutation.
- An open request is non-draft, mergeable at the confirmed SHA, supports
  `squash`, and is observed as merged after the attempt.
- The item is transitioned only after the merge is observed, or is already
  done.
- Results identify both records and any remaining request or item action.
- A changed caller SHA requires a new explicit `/inspect`; no approval transfers
  to the new head.
- No unrelated mutation or downstream workflow occurs.

## Stop Conditions

Stop after completion, declined confirmation, or an exact blocker. A missing
`agent-inspected` label stops without confirmation or mutation and reports
whether the request is still awaiting inspection or was already merged without
inspection evidence. Never retry, roll back, or invoke another workflow
automatically.

## Human Validation

Require one mutation confirmation unless nothing remains to change.
