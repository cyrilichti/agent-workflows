# Inspect Complete

## Outcome

One exact request snapshot reaches an accurately reported inspection end, then
may continue to `/done` after a non-blocking publication attempt and an
explicit user choice. Workflow completion does not imply provider publication
success.

## Success Criteria

- One complete official item and open, non-draft request snapshot are bound to
  one frozen head SHA.
- One complete inspection result contains either persistent, valid findings with
  final decisions or explicit no findings.
- The accepted findings are locked against the same head SHA, then their counts
  and semantic verdict are confirmed for publication.
- Every attempted publication result is observed and reported without delivery
  mutation by `/inspect`.
- A reported publication attempt with no accepted blocking finding offers
  `/done`; a blocking result stops without a delivery handoff.

## Stop Conditions

- Complete after publication is declined, its attempted result is reported and
  no `/done` handoff is eligible or selected, or the selected handoff begins.
- Restart from a fresh snapshot after a stale confirmation.
- Stop and report incomplete context or a required-operation failure.

## Human Validation

Grouped curation requires one explicit final decision per finding. Publishing
requires explicit confirmation of the locked payload's summary and verdict.
An eligible `/done` handoff requires a separate explicit choice; `/done` owns
its mutation confirmation.
