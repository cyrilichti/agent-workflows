# Review Complete

## Outcome

One complete official item and exact open request snapshot have been reviewed
and curated, then the workflow reached one accurately reported terminal end.
Workflow completion does not imply that provider publication succeeded.

## Success Criteria

- The review uses one complete official item and one complete request snapshot
  frozen at an exact head SHA.
- The reviewer returns one complete result bound to that SHA with explicit
  coverage and either valid findings or an explicit no-findings outcome.
- Every finding has one persistent identity, and every prior finding is
  reconciled exactly once on a rerun.
- Every finding receives a final user decision.
- The exact final publication payload is confirmed against the same head SHA.
- Every attempted grouped review and included finding is observed and reported
  accurately.
- The workflow stops without delivery mutations or downstream workflow
  invocation.

## Stop Conditions

- Complete the workflow when the user declines publication or after every
  attempted publication result has been observed and reported.
- Discard a stale review cycle and restart from a fresh snapshot when the head
  SHA changes before publication.
- Stop and report when required official context is incomplete or a required
  provider operation fails.

## Human Validation

Every finding requires an explicit `Accept`, `Reject`, or completed `Modify`
decision, which may be collected in grouped curation. Publishing requires
explicit confirmation of the complete exact payload.
