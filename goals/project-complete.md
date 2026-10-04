# Project Complete

## Outcome

One destination name and item ID identify an absolute local project directory
or yield an explicit unresolved status.

## Success Criteria

- A unique matching Git repository root from Codex's configured project paths
  is returned without scanning the home directory.
- The fallback checks repositories beside configured projects before searching
  under the home directory, and stops when it finds an exact match.
- Multiple candidate repositories are resolved using the complete item,
  frontend preference, and a stable final tie break.
- Only directories with a `.git` file or directory at their root are eligible.
  Without an exact match, incomplete home searches return a status.

## Stop Conditions

- Stop after returning the resolver result.
- Stop with an input error when `list` or the item ID is missing.
- Stop and report an execution error when the resolver cannot run.
