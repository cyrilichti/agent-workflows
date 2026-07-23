# Retrieve Backlog Items

Retrieve backlog items from a resolved provider.

## Input

- `provider`: resolved MCP provider.
- `criteria`: backlog item filtering rules.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `retrieve-items`.
3. Retrieve only backlog items matching `criteria`.
4. Prefer provider-native filtering, then post-filter when needed.
5. If no backlog item matches, tell the developer and stop without broadening
   the
   search.
6. Return the matching backlog items to the caller.

Do not inspect provider documentation when the provider adapter defines the
operation.
