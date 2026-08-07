# Refine Complete

## Outcome

One official parent item remains unchanged after refinement assessment or one
confirmed child decomposition attempt.

## Success Criteria

Report exactly one outcome:

- `refinement-not-needed`: one coherent unit; no mutation;
- `cancelled`: confirmation cancelled; no child created;
- `complete`: every confirmed child and relation created;
- `failed`: no child created; every child failure reported;
- `partially-failed`: some creation succeeded; created and failed children and
  relations reported separately.

## Stop Conditions

Stop after one valid outcome or required-operation failure. Do not retry or
roll back failed creation.

## Human Validation

Require explicit confirmation of the complete latest decomposition before any
provider mutation. Adjustment requires a new preview and confirmation; partial
confirmation is unsupported.
