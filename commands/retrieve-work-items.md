# Retrieve Work Items

Retrieve work items from a resolved provider.

## Input

- `provider`: resolved MCP provider.
- `criteria`: work item filtering rules.

## Steps

1. Load `.agents/providers/<provider>.md`.
2. Use the provider operation named `retrieve-work-items`.
3. Retrieve only work items matching `criteria`.
4. Prefer provider-native filtering, then post-filter when needed.
5. If no work item matches, tell the developer and stop without broadening the
   search.
6. Return the matching work items to the caller.

Do not inspect provider documentation when the provider adapter defines the
operation.
