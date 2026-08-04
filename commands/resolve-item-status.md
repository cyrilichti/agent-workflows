# Resolve Item Status

Resolve a semantic item status to provider-specific filtering criteria.

## Input

- `provider`: resolved item provider.
- `semantic_status`: normalized status requested by the caller, such as
  `review`.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `resolve-item-status`.
3. Return every provider status criterion matching `semantic_status`.

If the provider cannot enumerate its statuses, report resolution as
unavailable. Return an empty result when statuses are available but none match.
Do not retrieve or mutate items.
