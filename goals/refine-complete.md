# Refine Complete

## Outcome

One official parent item remains unchanged after refinement assessment or one
confirmed child decomposition attempt.

## Success Criteria

Report exactly one outcome:

- `refinement-not-needed`: one coherent unit; no mutation;
- `cancelled`: confirmation cancelled; no child created;
- `complete`: every confirmed child and relation created; report each child
  title, provider ID, link when available, and each created relation;
- `failed`: no child created; report every failed child title and failure;
- `partially-failed`: some creation succeeded; report created child titles,
  provider IDs, and links when available, failed child titles and failures, and
  created and failed relations separately.

## Stop Conditions

Stop after one valid outcome or required-operation failure. Do not retry or
roll back failed creation.

## Human Validation

Require explicit confirmation of the complete latest decomposition before any
provider mutation. Adjustment requires a new preview and confirmation; partial
confirmation is unsupported.
