# Transition Item Status

## Read

Read the issue, then its team statuses:

```text
tool: get_issue
arguments:
  id: caller item ID or identifier
```

```text
tool: list_issue_statuses
arguments:
  team: returned issue team name or ID
```

Return the current and available statuses as `id`, `name`, and `category`:

- `completed`: Linear type `completed`, or a clear done or completed name;
- `review`: name clearly identifies review;
- `active`: Linear type `started`, excluding review;
- `other`: every remaining status.

Return the provider failure when either read fails.

## Apply

```text
tool: save_issue
arguments:
  id: caller item ID or identifier
  state: exact resolved status ID or name
```

Return the resulting status or provider failure. Do not pass any other field.
