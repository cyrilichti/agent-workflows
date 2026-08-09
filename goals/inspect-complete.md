# Inspect Complete

## Outcome

One exact request snapshot reaches an accurately reported inspection end. Workflow
completion does not imply provider publication success.

## Success Criteria

- One complete official item and open, non-draft request snapshot are bound to
  one frozen head SHA.
- One complete inspection result contains either persistent, valid findings with
  final decisions or explicit no findings.
- The exact final publication payload is confirmed against the same head SHA.
- Every attempted publication result is observed and reported without delivery
  mutation or downstream workflow invocation.

## Stop Conditions

- Complete after publication is declined or its attempted result is reported.
- Restart from a fresh snapshot after a stale confirmation.
- Stop and report incomplete context or a required-operation failure.

## Human Validation

Grouped curation requires one explicit final decision per finding. Publishing
requires explicit confirmation of the complete exact payload.
