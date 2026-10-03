# Resolve Version Provider

Resolve the provider configured for version operations.

## Steps

1. Read `agent-workflows.yaml` from the project root.
2. Resolve `mcp.version.provider`.
3. Require a matching directory at `../providers/<provider>/`.
4. For `github`, require the `gh` executable. The GitHub adapter checks
   authentication for the parsed repository host before an operation.
5. For `gitlab`, return the configured provider.
6. Stop for any other configured value and list `github` and `gitlab` as the
   supported version providers.

If the configuration, provider directory, or required `gh` executable is
missing, stop before provider mutation and identify what must be configured.
Operation-specific files and dependencies are resolved only when a command
needs them.
