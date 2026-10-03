# Resolve Version Provider

Resolve the provider configured for version operations.

## Steps

1. Read `agent-workflows.yaml` from the project root.
2. Resolve `mcp.version.provider`.
3. Require a matching directory at `../providers/<provider>/`.
4. For `github` or `gitlab`, return the configured provider.
5. Stop for any other configured value and list `github` and `gitlab` as the
   supported version providers.

If the configuration or provider directory is missing, stop before provider
mutation and identify what must be configured.
Operation-specific files and dependencies are resolved only when a command
needs them.
