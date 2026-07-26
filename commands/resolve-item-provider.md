# Resolve Item Provider

Resolve the MCP provider configured for a context.

## Input

- `context`: provider context key under `mcp.<context>` in
  `agent-workflows.yaml`, for
  example `item` or `review`.

## Steps

1. Read `agent-workflows.yaml` from the project root.
2. Resolve `mcp.<context>.provider`.
3. Verify that the provider is available in the current AI tool environment.
4. If `agent-workflows.yaml` is missing, the provider is missing, or the
   provider is not available, stop and explain what must be configured before
   continuing.
