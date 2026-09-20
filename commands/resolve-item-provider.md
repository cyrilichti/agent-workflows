# Resolve Item Provider

Resolve the MCP provider configured for item operations.

## Input

- `context`: exactly `item`.

## Steps

1. Require `context` to be exactly `item`. Stop if it is not.
2. Read `agent-workflows.yaml` from the project root.
3. Resolve `mcp.item.provider` and treat that configured value as
   authoritative. Do not select or fall back to another provider.
4. Resolve the configured provider through the active MCP runtime, using tool
   discovery when needed. Stop only if this resolution fails, and report the
   observed availability, authentication, or initialization failure.

If `agent-workflows.yaml` or `mcp.item.provider` is missing, stop and explain
what must be configured before continuing.
