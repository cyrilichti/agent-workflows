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
- Stop and report when an operation fails.

## Human Validation

The title and body require explicit confirmation before saving.
Assignment requires a separate explicit choice.
