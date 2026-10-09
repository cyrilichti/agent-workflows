# Next Complete

## Outcome

The configured provider's next-item selection result is returned without
mutation.

## Success Criteria

- Selection follows `../commands/select-next-item.md`.
- The result follows `../templates/next-result.md`.
- No item, repository, plan, or delivery state was changed.

## Stop Conditions

- Stop after formatting the selection result.
- Stop and report an error returned by the selection command.
