# Retrieve Items

Retrieve items from a resolved provider.

## Input

- `provider`: resolved MCP provider.
- `criteria`: item filtering rules.

## Steps

1. Load `../providers/<provider>/retrieve-items.md`. If the file is missing,
   stop.
2. Follow the loaded operation to retrieve only items matching `criteria`.
3. Prefer provider-native filtering, then post-filter when needed.
4. If no item matches, tell the user and stop without broadening the search.
5. Return the matching items to the caller.

Do not inspect provider documentation when the provider adapter defines the
operation.
