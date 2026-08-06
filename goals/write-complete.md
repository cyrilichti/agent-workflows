# Write Complete

## Outcome

Exactly one confirmed item has been saved through the configured item provider.

## Success Criteria

- The saved item contains the confirmed title and Markdown body.
- Only the workflow performed provider mutations.
- The explicit assignment choice was honored.
- The outcome was presented with `../templates/write-result.md`.

## Stop Conditions

- Stop successfully when all success criteria are satisfied.
- Stop and report partial success when the item is saved but assignment fails.
- Stop and report the blocker when a required provider operation fails before
  any item is saved.

## Human Validation

The title and body require explicit confirmation before saving.
Assignment requires a separate explicit choice.
Mode and need description precede provider resolution and `item-writer`
activation.
