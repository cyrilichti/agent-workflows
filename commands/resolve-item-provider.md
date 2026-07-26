# Resolve Item Provider

Resolve the MCP provider configured for a context.

## Input

- `context`: provider context key under `mcp.<context>` in `agentic.yaml`, for
  example `item` or `review`.

## Steps

1. Read `agentic.yaml` from the project root.
2. Resolve `mcp.<context>.provider`.
3. Verify that the provider is available in the current AI tool environment.
4. If `agentic.yaml` is missing, the provider is missing, or the provider is not
   available, stop and explain what must be configured before continuing.
