# Save Item

Create a new item or update the authored fields of an existing item.

## Input

- `provider`: resolved item provider.
- `mode`: `create` or `update`.
- `content`: confirmed title and free-form Markdown body.
- `destination`: provider-specific creation destination, required for `create`.
- `item_id`: existing provider item ID, required for `update`.

## Steps

1. Load exactly one provider operation for `mode`:
   - `create` → `../providers/<provider>/create-item.md`;
   - `update` → `../providers/<provider>/update-item.md`.
   Stop when `mode` is invalid or the operation file is missing.
2. Follow the operation with `content` and the mode-specific `destination` or
   `item_id`. Persist only the confirmed title and Markdown body; leave every
   other field unchanged.
3. Return according to `../rules/mutation-response.md`.
