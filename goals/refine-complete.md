# Refine Complete

## Outcome

One official parent item remains unchanged after refinement assessment or one
confirmed child decomposition attempt.

## Success Criteria

Report exactly one outcome:

- `refinement-not-needed`: one coherent unit; no mutation;
- `cancelled`: confirmation cancelled; no child created;
- `complete`: every confirmed child and relation was created and every required
  `agent-shaped` label was applied; report each child title, provider ID, link
  when available, its required label result, and each created relation;
- `failed`: no child created; report every failed child title and failure;
- `partially-failed`: at least one child was created but a child creation,
  required label, or relation failed; report created child titles, provider
  IDs, links when available, and required label results, failed child titles
  and failures, and created and failed relations separately.

## Stop Conditions

Stop after reporting one valid outcome or a required-operation failure.

## Human Validation

Require explicit confirmation of the complete latest decomposition before any
provider mutation. Adjustment requires a new preview and confirmation; partial
confirmation is unsupported.
