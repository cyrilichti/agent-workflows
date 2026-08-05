# Save Item

Create a new item or update the authored fields of an existing item.

## Input

- `provider`: resolved item provider.
- `mode`: `create` or `update`.
- `content`: confirmed title and free-form Markdown body.
- `destination`: provider-specific creation destination, required for `create`.
- `item_id`: existing provider item ID, required for `update`.

## Steps

1. Require `mode` to be exactly `create` or `update`. Stop if it is not.
2. For `create`, load `../providers/<provider>/create-item.md`. If the file is
   missing, stop. Follow the loaded operation with the confirmed content and
   destination.
3. For `update`, load `../providers/<provider>/update-item.md`. If the file is
   missing, stop. Follow the loaded operation with the item ID and only the
   confirmed authored fields.
4. Return the saved item ID, title, link, and destination when available.

Do not change status, assignment, or provider fields outside the confirmed
content. Persist only the confirmed title and Markdown body as authored
content.
