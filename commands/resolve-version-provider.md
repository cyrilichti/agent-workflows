# Resolve Version Provider

Resolve the MCP provider configured for version operations.

## Steps

1. Read `agent-workflows.yaml` from the project root.
2. Resolve `mcp.version.provider`.
3. Require a matching directory at `../providers/<provider>/`.
4. Verify that the configured MCP provider is available in the current AI tool
   environment.
5. Return the configured provider.

If the configuration, provider directory, or MCP provider is missing, stop
before provider mutation and identify what must be configured.
Operation-specific files and MCP tools are resolved only when a command needs
them.
