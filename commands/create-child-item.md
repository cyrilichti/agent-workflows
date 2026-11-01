# Create Child Item

## Input

- `provider`: resolved item provider.
- `parent_item`: official parent item with provider ID and destination.
- `child`: confirmed title and free-form Markdown body.

## Steps

1. Require the parent ID and destination. On a missing value, return a failure
   without creating an item.
2. Load `../providers/<provider>/create-child-item.md` and follow its operation
   with the confirmed child, parent ID, and parent destination.
3. Return the created child ID, title, link, destination, and parent ID when
   available, or the observed failure.

Create exactly one native child in the parent's destination. Do not change the
parent or set other child fields.
