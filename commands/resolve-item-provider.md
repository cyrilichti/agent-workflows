# Resolve Item Provider

Resolve the provider configured for item operations.

## Steps

1. Read `agent-workflows.yaml` from the project root.
2. Resolve `mcp.item.provider` and treat that configured value as authoritative.
   Do not select or fall back to another provider.
3. Require a matching directory at `../providers/<provider>/`.
4. For `clickup`, return the configured provider.
5. For `linear`, return the configured provider. The `schpet/linear-cli`
   executable and authentication are prerequisites for its operations.
6. Stop for any other value and list `clickup` and `linear` as supported values.

If the configuration or `mcp.item.provider` is missing, stop and explain what
must be configured before continuing.
