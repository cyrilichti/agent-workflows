# Resolve Backlog Destination

Resolve the provider-specific destination for a new backlog item.

## Input

- `provider`: resolved backlog provider.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `list-destinations`.
3. Return only destinations that can contain a newly created item.
4. Provide a readable hierarchical label and internal provider value for each
   destination.

If no valid destination is available, stop before item creation.
