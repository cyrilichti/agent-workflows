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

When `fields` contains `request_backlinks`, retrieve every page of the item's
comments and return every pull-request or merge-request backlink URL. If every
comments page cannot be read, stop without returning the item. Do not retrieve
comments when `request_backlinks` was not requested.

If the item cannot be found or read, stop without substituting a search result.
