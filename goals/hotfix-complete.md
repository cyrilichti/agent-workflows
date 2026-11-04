# Hotfix Complete

## Outcome

One confirmed, concise item captures the urgent bug report and continues to
`/pick` through the configured item provider.

## Terminal Outcomes

- Continued: `agent-shaped` application is confirmed, the `hotfix` label result
  is reported, and the saved item ID is passed to `/pick` for official resolution
  and eligibility checking. A failed `hotfix` label does not block the handoff.
- Saved but stopped: report the saved item and the exact failed operation; do
  not invoke `/pick`.
- Stopped without saving: report no successful save.
