# Select Next Item

Return one item from the configured provider without an item reference.

## Input

- `provider`: resolved item provider.

## Steps

1. Load `../providers/<provider>/select-next-item.md`. Stop when it is missing.
2. Run its single filtered selection call across the configured provider,
   without a project, team, list, or assignee scope. Apply the provider's
   eligibility rule to the returned page and use its first eligible result.
   Do not follow another page or read individual items.
3. Return the selected item's `{name, id, url, list}`, or
   `{ "status": "no eligible item" }` when the call returns no match. A failed
   call or a selected item without a destination name is an error, not an empty
   result.
