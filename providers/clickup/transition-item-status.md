# Transition Item Status

## Read

When complete normalized `status_resolution` is not supplied, obtain the
current task and its available statuses with:

```text
tool: clickup_get_task
arguments:
  task_id: caller item ID
  expand_statuses: true
```

Reuse a supplied official current status only when it matches the task's
returned current status. Otherwise normalize the returned current status. Use
the returned expanded statuses as the available statuses in both cases.

Return the current and available statuses as `id`, `name`, and `category`:

- `completed`: done or closed type, or a clear done, completed, or closed name;
- `review`: name clearly identifies review;
- `active`: exact `in progress` name or a clear non-review active-work status;
- `other`: every remaining status.

Return the provider failure when the read fails.

## Apply

```text
tool: clickup_update_task
arguments:
  task_id: caller item ID
  status: exact resolved status name
```

Return the resulting status or provider failure. Do not pass any other field.
