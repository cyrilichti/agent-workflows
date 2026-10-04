# Resolve Local Project Complete

## Outcome

One destination name and item ID identify an absolute local project directory
or yield an explicit unresolved status.

## Success Criteria

- A unique matching Git repository root from Codex's configured project paths
  is returned without scanning the home directory.
- The fallback search is bounded as specified by the resolver command.
- Multiple candidate repositories are resolved using the complete item,
  frontend preference, and a stable final tie break.
- Missing, invalid, or incomplete search results return only a status and never
  an uncertain path.
- No project, item, or repository state is changed.

## Stop Conditions

- Stop after returning the resolver result.
- Stop and report an execution error when the resolver cannot run.
