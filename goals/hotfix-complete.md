# Hotfix Complete

## Outcome

One concise item is created directly from the urgent bug report through the
configured item provider and continues to `/pick` for the item recap and plan
approval.

## Terminal Outcomes

- Continued: `agent-shaped` application is confirmed, the `hotfix` label result
  is reported, and the saved item ID is passed to `/pick` for official resolution
  and eligibility checking. A failed `hotfix` label does not block the handoff.
- Saved but stopped: report the saved item and the exact failed operation; do
  not invoke `/pick`.
- Stopped without saving: report no successful save.
