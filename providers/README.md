# Providers

Providers are adapters for external work-item and version-control systems.

They map generic workflow commands to concrete MCP tools and arguments so agents
do not rediscover provider APIs on every run. Providers do not decide which work
to select; callers supply criteria and providers document how to execute them.

## Layout

- Provider operations live in `<provider>/<operation>.md`.
- Each operation file is the unique authoritative definition for that provider
  operation.

Commands load only the exact operation file they require and stop when it is
missing.
