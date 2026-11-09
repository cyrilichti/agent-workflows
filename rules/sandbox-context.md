# Sandbox Context

When `sandbox_context` is available:

- Carry it unchanged through `/work`, `/ready`, and `/inspect` handoffs.
- Use its worktree, service, and port mappings for validation. From outside the
  sandbox, reach services through their `host` ports.
- On terminal success, stop, or failure, follow `../workflows/sandbox.md` with
  that context before reporting the outcome. Report both outcomes; if teardown
  fails, retain the context for retry. A handoff to another delivery workflow
  is not terminal.
