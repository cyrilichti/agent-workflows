# Resolve Context Provider

Resolve the MCP provider configured for a workflow.

## Input

- `workflow`: current workflow name, for example `backlog-item` or `review`.

## Steps

1. Read `agentic.yaml` from the project root.
2. Resolve `mcp.<workflow>.provider`.
3. Verify that the provider is available in the current AI tool environment.
4. If `agentic.yaml` is missing, the provider is missing, or the provider is not
   available, stop and explain what must be configured before continuing.
