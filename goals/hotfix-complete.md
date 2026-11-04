# Hotfix Complete

## Outcome

One confirmed, concise item captures the urgent bug report and continues to
`/pick` through the configured item provider.

## Terminal Outcomes

- Continued: the saved official item is open, has `agent-shaped` and no
  `agent-planned`, and its complete context is passed to `/pick`. The `hotfix`
  label result is reported; its failure does not block this handoff.
- Saved but stopped: report the saved item and the exact failed operation or
  unmet eligibility condition; do not invoke `/pick`.
- Stopped without saving: report no successful save.
