# Read Backlog Item

Read one official backlog item from a configured provider.

## Input

- `provider`: resolved backlog provider.
- `item_id`: provider item ID or an ID resolved from a provider URL.
- `fields`: optional caller-requested fields in addition to the core item.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `read-item`.
3. Retrieve the core item fields: title, description, status, destination,
   assignees, and link when available.
4. Retrieve the caller-requested fields when the provider supports them.
5. Return the official item and its provider ID to the caller.

If the item cannot be found or read, stop without substituting a search result.
