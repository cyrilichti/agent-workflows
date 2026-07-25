# Save Item

Create a new item or update the authored fields of an existing item.

## Input

- `provider`: resolved item provider.
- `mode`: `create` or `update`.
- `content`: confirmed title and free-form Markdown body.
- `destination`: provider-specific creation destination, required for `create`.
- `item_id`: existing provider item ID, required for `update`.

## Steps

1. Load `../providers/<provider>.md`.
2. For `create`, use the provider operation named `create-item` with the
   confirmed content and destination.
3. For `update`, use the provider operation named `update-item` with the item ID
   and only the confirmed authored fields.
4. Return the saved item ID, title, link, and destination when available.

Do not change status, assignment, or provider fields outside the confirmed
content. Do not persist workflow metadata supplied alongside the authored
title and body.
