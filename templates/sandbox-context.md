# Sandbox Context

`SandboxContext` is the serializable resource ownership record defined in
`../commands/sandbox-context.ts`. Carry the returned object unchanged between
preparation and teardown, including on failure. It records the item, unique
root, source/worktree pairs, optional Docker sandbox name, and published ports.

Teardown accepts a partial record with an empty repository list or no Docker
sandbox. Keep a failed teardown's context for retry.
