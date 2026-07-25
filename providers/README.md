# Providers

Providers are adapters for external work sources.

Provider adapters document the exact MCP operations agents should use for common
commands.

## Responsibilities

Use providers to:

- map generic commands to concrete provider tools;
- document known MCP calls and arguments;
- prevent agents from rediscovering provider APIs during each task.

## Boundaries

Providers do not decide which work should be selected or performed. The caller
provides criteria; the provider explains how to execute them.

## Structure

Each provider file should define reusable operations such as:

- `retrieve-items`
- `read-item`
- `update-item-status`

When a command needs a provider, load `./<provider>.md` and use
the documented operation. Do not inspect provider documentation unless the
adapter is missing or incomplete.
