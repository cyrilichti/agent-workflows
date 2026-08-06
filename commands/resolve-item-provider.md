# Resolve Item Provider

Resolve the MCP provider configured for item operations.

## Input

- `context`: exactly `item`.

## Steps

1. Require `context` to be exactly `item`. Stop if it is not.
2. Read `agent-workflows.yaml` from the project root.
3. Resolve `mcp.item.provider`.
4. Verify that the provider is available in the current AI tool environment.
5. If `agent-workflows.yaml` is missing, the provider is missing, or the
   provider is not available, stop and explain what must be configured before
   continuing.
