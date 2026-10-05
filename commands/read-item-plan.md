# Read Item Plan

Read the initial approved plan published on an official item.

## Input

- `provider`: resolved item provider.
- `item_id`: official provider item ID.

## Steps

1. Load `../providers/<provider>/read-item-plan.md`.
2. Read the item comments and find the comment identified by
   `../templates/item-plan-comment.md`.
3. Return the complete content after the marker and its required blank line as
   `plan_content`.

Stop when the provider operation fails or no identified plan comment exists.
Do not modify the returned plan content.
