# Start Backlog Item

Move the selected backlog item to the provider status used for active work.

## Input

- `provider`: resolved MCP provider.
- `item_id`: selected provider item ID.
- `target_status`: normalized target status, usually `in progress`.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `update-item-status`.
3. Move `item_id` to `target_status`.
4. If the provider requires a workspace-specific status name, use the closest
   active-work status defined for the item.
5. If more than one active-work status could match, ask the user to choose
   one using `../templates/select-option.md`.
6. Return the updated item status to the caller.
