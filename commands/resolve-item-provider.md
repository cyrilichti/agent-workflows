# Resolve Item Provider

Resolve the provider configured for item operations.

## Steps

1. Read `agent-workflows.yaml` from the project root.
2. Resolve `mcp.item.provider` and treat that configured value as authoritative.
   Do not select or fall back to another provider.
3. Require a matching directory at `../providers/<provider>/`.
4. For `clickup`, return the configured provider.
5. For `linear`, require the `linear` executable from `schpet/linear-cli` on
   `PATH`. Check authenticated access with
   `linear api --silent 'query { viewer { id } }'`. Stop on an observed
   availability or authentication failure.
6. Stop for any other value and list `clickup` and `linear` as supported values.

If the configuration or `mcp.item.provider` is missing, stop and explain what
must be configured before continuing.
