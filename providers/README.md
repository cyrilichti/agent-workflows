# Providers

Providers are adapters for external work-item and version-control systems.

They map generic workflow commands to concrete MCP tools and arguments so agents
do not rediscover provider APIs on every run. Providers do not decide which work
to select; callers supply criteria and providers document how to execute them.

## Layout

- `github.md` and `gitlab.md` — version-control adapters (single file each).
- `clickup.md` and `linear.md` — shared item-provider operations that have not
  been split out yet.
- `clickup/<operation>.md` and `linear/<operation>.md` — one file per extracted
  item operation (for example search, read, create, update, assign).

Commands load the per-operation file when it exists for that provider;
otherwise they use the matching section in the provider monolith.
