# Write Complete

## Outcome

Exactly one confirmed item has been saved through the configured item provider.

## Success Criteria

- The saved item contains the confirmed title and Markdown body.
- Only the workflow performed provider mutations.
- Save and assignment remained separate operations.
- The explicit assignment choice was honored.
- The saved item link was reported when available from the save mutation or
  still-valid carried state.
- The resulting assignment was reported when available: mutation result when
  assignment was applied, still-valid carried assignment when it was left
  unchanged, or `Unavailable` when it could not be obtained without a
  systematic post-mutation re-read.

## Stop Conditions

- Stop successfully when all success criteria are satisfied.
- Stop and report partial success when the item is saved but assignment fails,
  still reporting the save mutation link when available.
- Stop and report the blocker when a required provider operation fails before
  any item is saved.

## Human Validation

The title and body require explicit confirmation before saving.
Assignment requires a separate explicit choice between applying a selected
assignee and leaving assignment unchanged.
