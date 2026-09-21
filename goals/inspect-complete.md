# Inspect Complete

## Outcome

One exact request snapshot is inspected and published autonomously. Blocking
findings return to `/work`; a passing inspection applies `agent-inspected` and
stops without invoking `/done`.

## Success Criteria

- Caller context is preserved, while standalone inspection selects one local
  authoritative plan, complete official item, and exact open, non-draft request
  before autonomous execution.
- One complete inspection result is bound to one frozen head SHA.
- Every valid finding is published once for that SHA; prior same-SHA
  publications are observed instead of duplicated.
- Blocking findings return to `/work` with their IDs, exact content, and source
  SHA only after publication is complete.
- With no blocking finding, `agent-inspected` is applied only after publication
  is complete, then the workflow stops.

## Stop Conditions

- Continue through `/work` after complete publication of blocking findings.
- Complete after the final label is applied with no blocking finding.
- Restart from a fresh snapshot after a stale publication boundary.
- Stop on incomplete context, inconsistent prior publication, publication
  failure, or label failure.

## Human Validation

The standalone plan, item, and request selections, or complete caller handoff,
authorize inspection and publication. A standalone caller must already possess
the ignored plan file. No finding curation, publication confirmation, or
`/done` choice is requested.
