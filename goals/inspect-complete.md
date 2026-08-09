# Inspect Complete

## Outcome

One exact request snapshot reaches an accurately reported inspection end, then
may continue to `/done` after an `approve` verdict is observed as successfully
published and the user explicitly chooses the handoff. Workflow completion
does not imply provider publication success.

## Success Criteria

- One complete official item and open, non-draft request snapshot are bound to
  one frozen head SHA.
- One complete inspection result contains either persistent, valid findings with
  final decisions or explicit no findings.
- The accepted findings are locked against the same head SHA, then their counts
  and semantic verdict are confirmed for publication.
- Every attempted publication result is observed and reported without delivery
  mutation by `/inspect`.
- A successfully published `approve` verdict on the unchanged frozen SHA and
  with observed post-publication delivery state offers a `/done` handoff.
  Accepting passes one compact completion context without inspection-only
  content; declining stops. Every other verdict or publication result stops
  without offering the handoff.

## Stop Conditions

- Complete after publication is declined, its attempted result is reported and
  no `/done` handoff is eligible or selected, or the selected handoff begins.
- Restart from a fresh snapshot after a stale confirmation.
- Stop and report incomplete context or a required-operation failure.

## Human Validation

Grouped curation requires one explicit final decision per finding. Publishing
requires explicit confirmation of the locked payload's summary and verdict.
An eligible `/done` handoff requires a separate explicit choice. `/done` then
owns its mutation confirmation.
