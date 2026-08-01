# Link Request to Item

Add one discoverable draft request backlink to an official item.

## Input

- `provider`: resolved item provider.
- `item_id`: official provider item ID.
- `request_kind`: `merge_request` or `pull_request` from the created request.
- `request_url`: newly created request URL.
- `plan_id`: stable plan ID.

## Comment

For `request_kind: merge_request`:

```text
Draft MR: <request_url>

Agent-Workflows-Plan: <plan_id>
```

For `request_kind: pull_request`:

```text
Draft PR: <request_url>

Agent-Workflows-Plan: <plan_id>
```

## Steps

1. Load `../providers/<provider>.md`.
2. Select the exact comment for `request_kind`. Stop when the kind is not
   supported.
3. Use `add-request-backlink` with that exact comment.
4. Return the created backlink.

Do not update item status, title, description, assignment, labels, or any other
item field. Call this command only after creating a new request and never while
resuming existing work.
