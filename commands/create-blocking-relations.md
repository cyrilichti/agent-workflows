# Create Blocking Relations

Create confirmed provider-native blocking relations for one created child.

## Input

- `provider`: resolved item provider.
- `blocked_item_id`: provider ID of the created child that must wait.
- `blocking_item_ids`: one or more provider IDs of created children that block
  it.

## Steps

1. Require the supplied child IDs. On a missing ID, return a failure without a
   provider call.
2. Load `../providers/<provider>/create-blocking-relations.md` and follow its
   operation with the supplied IDs.
3. Return the created relations and any observed failure.

Use only the supplied child IDs. Do not change item fields or the parent.
