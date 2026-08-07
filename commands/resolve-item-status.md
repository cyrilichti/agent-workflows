# Resolve Item Status

Resolve a semantic item status to provider-specific filtering criteria.

## Input

- `provider`: resolved item provider.
- `semantic_status`: normalized status requested by the caller, such as
  `review`.

## Steps

1. Load `../providers/<provider>/resolve-item-status.md`. Stop when it is
   missing.
2. Follow the operation with `semantic_status`.
3. Return every matching provider status criterion.

If the provider cannot enumerate its statuses, report resolution as
unavailable. Return an empty result when statuses are available but none match.
Do not retrieve or mutate items.
