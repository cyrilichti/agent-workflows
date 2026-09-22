# Done Complete

## Outcome

One exact request is merged and its official item is done, or the workflow
stops with the exact observed blocker or declined mutation.

## Success Criteria

- Context comes from standalone resolution or one valid caller packet.
- The official item has `agent-inspected` before completion is offered.
- An open request is squash-merged only while unchanged and mergeable.
- The item is done only after the request is observed as merged.
- Results identify both records and any remaining request or item action.

## Stop Conditions

Stop after completion, declined confirmation, or an observed blocker.

## Human Validation

Require one mutation confirmation unless nothing remains to change.
