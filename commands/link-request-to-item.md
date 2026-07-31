# Link Request to Item

Add one discoverable draft merge-request backlink to an official item.

## Input

- `provider`: resolved item provider.
- `item_id`: official provider item ID.
- `request_url`: newly created merge request URL.
- `plan_id`: stable plan ID.

## Comment

```text
Draft MR: <request_url>

Agent-Workflows-Plan: <plan_id>
```

## Steps

1. Load `../providers/<provider>.md`.
2. Use `add-request-backlink` with the exact comment above.
3. Return the created backlink.

Do not update item status, title, description, assignment, labels, or any other
item field. Call this command only after creating a new merge request. Do not
call it while resuming existing work, and do not retry automatically when the
provider result is ambiguous.
