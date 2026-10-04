# Project Complete

## Outcome

One destination name and item ID identify an absolute local project directory
or yield an explicit unresolved status.

## Success Criteria

- A unique matching Git repository root from Codex's configured project paths
  is returned without scanning the home directory.
- The fallback search is bounded as specified by the resolver command.
- Multiple candidate repositories are resolved using the complete item,
  frontend preference, and a stable final tie break.
- An exact repository match is returned even when the fallback search cannot
  inspect every directory. Without an exact match, incomplete searches return
  a status.

## Stop Conditions

- Stop after returning the resolver result.
- Stop with an input error when `list` or the item ID is missing.
- Stop and report an execution error when the resolver cannot run.
