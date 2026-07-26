# Retrieve Items

Retrieve items from a resolved provider.

## Input

- `provider`: resolved MCP provider.
- `criteria`: item filtering rules.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `retrieve-items`.
3. Retrieve only items matching `criteria`.
4. Prefer provider-native filtering, then post-filter when needed.
5. If no item matches, tell the user and stop without broadening the search.
6. Return the matching items to the caller.

Do not inspect provider documentation when the provider adapter defines the
operation.
