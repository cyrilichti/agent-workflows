# Pick Complete

## Outcome

One official item is either recognized as already planned or summarized and
routed from its planning result.

## Terminal Outcomes

- Already planned: the open item contains `agent-planned` and is identified as
  available for `/work` without another planning attempt.
- Planned: the approved plan is published, `agent-planned` is observed, and
  the plan with its complete official item context is handed to `/work`.
- Refinement: the `needs-refinement` result leaves the parent unchanged by
  `/pick`, honors the selected refinement outcome, and stops before
  implementation.
- Ineligible: an item whose openness or `agent-shaped` label is not confirmed
  is identified and stopped before summary or planning.
- Stopped: a required operation failure is reported from its observed result.
