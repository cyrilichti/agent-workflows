# Project Complete

## Outcome

One destination name and item ID identify an absolute local project directory
or yield an explicit unresolved status.

## Success Criteria

- A resolved result is one absolute canonical path to a directory with a
  `.git` file or directory at its root.
- Configured projects outrank neighboring repositories, which outrank home
  repositories; exact name matches outrank prefix matches within that order.
- Multiple equally ranked repositories are resolved using the complete item,
  frontend preference, and a stable lexicographic final tie break.
- An unresolved result distinguishes `not found` from `search incomplete` and
  contains no path.

## Stop Conditions

- Stop after returning the resolver result.
- Stop with an input error when `list` or the item ID is missing.
- Stop and report an execution error when the resolver cannot run.
