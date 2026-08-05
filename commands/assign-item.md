# Assign Item

Assign one saved item to the selected person.

## Input

- `provider`: resolved item provider.
- `item_id`: saved provider item ID.
- `assignee`: selected provider assignee value.

## Steps

1. Load `../providers/<provider>/assign-item.md`. If the file is missing, stop.
2. Follow the loaded operation to assign the item to the selected person without
   modifying other item fields.
3. Prefer the mutation response for the resulting assignment. Do not
   systematically re-read after the mutation. If the result is missing or
   ambiguous and required by the caller, read it once; otherwise return
   `Unavailable` for that field.
4. Return the assigned person and item ID.

If assignment fails, return the failure without undoing or hiding a successful
create or update operation.
