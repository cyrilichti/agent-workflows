# Resolve Version Provider

Resolve the MCP provider configured for version operations.

## Steps

1. Read `agent-workflows.yaml` from the project root.
2. Resolve `mcp.version.provider`.
3. Require a matching adapter at `../providers/<provider>.md`.
4. Verify that the configured MCP provider is available in the current AI tool
   environment.
5. Return the configured provider.

If the configuration, provider adapter, or MCP provider is missing, stop before
provider mutation and identify what must be configured. Operation-specific MCP
tools are resolved only when a command loads and executes the corresponding
provider operation.
