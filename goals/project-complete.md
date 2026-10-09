# Project Complete

## Outcome

One destination name and item ID identify an absolute local project directory
or yield an explicit unresolved status.

## Terminal Outcomes

- Resolved: one absolute canonical path identifies a directory with a `.git`
  file or directory at its root.
- Unresolved: `not found` or `search incomplete` is explicit and no path is
  returned.
- Invalid: a missing `list` or item ID is reported as an input error.
- Failed: an execution error is reported without a path.
