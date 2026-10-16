# Transition Item Status

## Read

Reuse supplied `status_resolution` or exact official task context according to
`../../commands/transition-item-status.md`. Read missing context with:

```text
clickup-cli task get <item ID> --output json
clickup-cli list get <official task List ID> --output json
```

Use the task's current status and the List's effective `statuses`. Return
current and available statuses as `id`, `name`, and `category`: `completed`
for done/closed type or clear completed names, `review` for clear review names,
`active` for exact `in progress` or clear non-review active names, otherwise
`other`. Report read failures; the caller owns target selection.

## Apply

```text
clickup-cli task update <item ID> --status <exact resolved native name> --output json
```

Return the resulting status from the single mutation record or the provider
failure. Do not update any other field.
