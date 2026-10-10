# Select Next Item

Return one item from the configured provider without an item reference.

## Input

- `provider`: resolved item provider.

## Eligibility

Only items with the exact `agent-planned` label or tag that are waiting to
start are eligible. Each provider adapter translates this rule into its status
vocabulary using only the selection response; skip items whose waiting state
cannot be established.

## Steps

1. Load `../providers/<provider>/select-next-item.md`. Stop when it is missing.
2. Run its single filtered selection call across the configured provider,
   without a project, team, list, or assignee scope. Apply the provider's
   status mapping for this eligibility rule to the first returned page and
   use its first eligible result in provider order.
   Do not follow another page or read individual items.
3. Return the selected item's `name`, `id`, `url`, and `list`, or a no-match
   result. A failed call or a selected item without a destination name is an
   error, not a no-match result.
