# Resolve Version Provider

Resolve the provider configured for version operations.

## Steps

1. Read `agent-workflows.yaml` from the project root.
2. Resolve `mcp.version.provider`.
3. Require a matching directory at `../providers/<provider>/`.
4. For `github`, verify that the configured GitHub MCP provider is available in
   the current AI tool environment.
5. For `gitlab`, return the configured provider.
6. Stop for any other configured value and list `github` and `gitlab` as the
   supported version providers.

If the configuration, provider directory, or required GitHub MCP provider is
missing, stop before provider mutation and identify what must be configured.
Operation-specific files and dependencies are resolved only when a command
needs them.
