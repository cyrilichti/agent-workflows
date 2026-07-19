# Resolve Backlog Assignee

Resolve a person who can be assigned to a backlog item.

## Input

- `provider`: resolved backlog provider.
- `query`: `me` or a developer-provided person name.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `resolve-assignees`.
3. Search only for the provided query.
4. Return readable person names and internal provider IDs.

If no person matches, ask the caller for a refined name. Do not choose a person
implicitly.
