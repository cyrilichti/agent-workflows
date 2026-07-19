# Assign Backlog Item

Assign one saved backlog item to the selected person.

## Input

- `provider`: resolved backlog provider.
- `item_id`: saved provider item ID.
- `assignee`: selected provider assignee value.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `assign-item`.
3. Assign the item to the selected person without modifying other item fields.
4. Read the resulting assignment when the provider supports it.
5. Return the assigned person and item ID.

If assignment fails, return the failure without undoing or hiding a successful
create or update operation.
