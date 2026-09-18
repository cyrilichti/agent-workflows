# Apply Item Label

Apply one workflow label to a saved item without replacing its existing labels.

## Input

- `provider`: resolved item provider.
- `item_id`: saved provider item ID.
- `label`: label name to apply.

## Steps

1. Load `../providers/<provider>/apply-item-label.md`.
2. Follow the operation with the item ID and label.
3. Return:
   - `applied`: whether the label was applied;
   - `reason`: `label_missing` or `provider_failure` when it was not.

Return `applied: false` with `reason: provider_failure` when the operation
cannot be loaded or completed.
