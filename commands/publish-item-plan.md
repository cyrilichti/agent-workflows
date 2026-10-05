# Publish Item Plan

Publish one approved plan on an official item.

## Input

- `provider`: resolved item provider.
- `item_id`: official provider item ID.
- `plan_content`: exact complete approved plan content.

## Steps

1. Format the comment with `../templates/item-plan-comment.md`.
2. Load `../providers/<provider>/publish-item-plan.md`.
3. Create the comment with the item ID and exact formatted content.
4. Return the created comment result.

Do not update the item description, labels, status, assignment, or any other
field.

