# Retrieve Items

Retrieve items from a resolved provider.

## Input

- `provider`: resolved MCP provider.
- `criteria`: item filtering rules.
- `fields`: optional subset of `provider_id`, `title`, `status`, and
  `destination`.
- `limit`: optional maximum number of items to return.

## Steps

1. Load `../providers/<provider>/retrieve-items.md`. If the file is missing,
   stop.
2. Follow it once with `criteria`, `fields`, and `limit`. Never request another
   page.
3. Return the first matching normalized records in provider order, capped at
   `limit` when supplied. Return only the requested fields and no raw provider
   payload.
4. If no item matches, tell the user and stop without broadening the search.

Do not inspect provider documentation when the provider adapter defines the
operation.
