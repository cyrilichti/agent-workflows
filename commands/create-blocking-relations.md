# Create Blocking Relations

Create the confirmed provider-native blocking relations for one newly created
child item.

## Input

- `provider`: resolved item provider.
- `blocked_item_id`: provider ID of the created child that must wait.
- `blocking_item_ids`: one or more provider IDs of created children that block
  it.

## Steps

1. Require every provider ID from the caller. Do not resolve an ID from a
   title, search result, URL, or other provider lookup.
2. Load `../providers/<provider>/create-blocking-relations.md`. Stop when it is
   missing.
3. Follow the operation with the blocked child ID and complete list of blocking
   child IDs.
4. Return every created blocking relation and any failed relation.

Use only the operation and exact payload documented by the selected provider.
Do not search provider documentation, inspect tool schemas, or discover another
operation at runtime.

Do not change item content, parent relations, destination, status, assignment,
labels, or unrelated provider fields. Do not retry a failed relation
automatically.
