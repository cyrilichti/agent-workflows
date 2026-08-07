# Read Item

Read one official item from a configured provider.

## Input

- `provider`: resolved item provider.
- `item_id`: provider item ID.
- `fields`: optional caller-requested fields in addition to the core item.

## Steps

1. Load `../providers/<provider>/read-item.md`. If the file is missing, stop.
2. Follow the loaded operation to retrieve the core item fields: title,
   description, status, destination, assignees, and link when available.
3. Retrieve the caller-requested fields when the provider supports them.
4. Return the official item and its provider ID to the caller.

When comments or `request_backlinks` are requested, retrieve all comments once
and return the requested comments and backlink URLs. Stop without returning the
item when the comments are incomplete.

If the item cannot be found or read, stop without substituting a search result.
