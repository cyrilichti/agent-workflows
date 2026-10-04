# Resolve Local Project Complete

## Outcome

One destination name identifies an absolute local project directory or yields
an explicit unresolved status.

## Success Criteria

- A unique matching directory from Codex's configured project paths is returned
  without scanning the home directory.
- The fallback search is bounded as specified by the resolver command.
- Missing, multiple, invalid, or incomplete results return only a status and
  never an uncertain path.
- No project, item, or repository state is changed.

## Stop Conditions

- Stop after returning the resolver result.
- Stop and report an execution error when the resolver cannot run.
