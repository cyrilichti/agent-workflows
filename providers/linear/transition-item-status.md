# Transition Item Status

## Read

Reuse the caller's official item from the current workflow run when it includes
the current status and team. Otherwise read the issue:

```text
tool: get_issue
arguments:
  id: caller item ID or identifier
```

List that issue's team statuses:

```text
tool: list_issue_statuses
arguments:
  team: reused or returned issue team name or ID
```

Return the current and available statuses as `id`, `name`, and `category`:

- `completed`: Linear type `completed`, or a clear done or completed name;
- `review`: name clearly identifies review;
- `active`: Linear type `started`, excluding review;
- `other`: every remaining status.

Return the provider failure when a required read or normalization fails.

When the shared command supplies complete normalized `status_resolution`, the
read operation is omitted.

## Apply

```text
tool: save_issue
arguments:
  id: caller item ID or identifier
  state: exact resolved status ID or name
```

Return the resulting status or provider failure. Do not pass any other field.
