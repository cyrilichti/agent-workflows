# Create Child Item

Create one confirmed item as a native child of an official parent item.

## Input

- `provider`: resolved item provider.
- `parent`: official parent item containing its provider ID and destination.
- `content`: confirmed child title and free-form Markdown body.

## Steps

1. Require the official parent's provider ID and destination from the caller.
2. Load `../providers/<provider>.md`.
3. Use the provider operation named `create-child-item` with the confirmed
   content, parent ID, and parent destination.
4. Return the created child item ID, title, link, destination, and parent ID
   when available.

Create exactly one child item. Use the provider-native parent relation and the
parent's existing destination. Do not resolve or select another destination.
Do not change the parent or set child status, assignment, labels, or provider
fields outside the confirmed title, Markdown body, destination, and parent
relation.

If the parent ID or destination is unavailable, or child creation fails, return
the failure without creating an unparented item or retrying automatically.
