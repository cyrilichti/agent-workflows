# Transition Item Status

## Read

When the caller supplies an official item with a current status and team
destination, list that team's statuses first:

```text
tool: list_issue_statuses
arguments:
  team: supplied issue team name or ID
```

Reuse the supplied projection only when this read succeeds and its current
status matches one returned status. Otherwise read the issue once:

```text
tool: get_issue
arguments:
  id: caller item ID or identifier
```

For a caller without a complete official item, or when the returned team
differs from the supplied destination, list the returned current team's
statuses:

```text
tool: list_issue_statuses
arguments:
  team: returned issue team name or ID
```

When the issue still belongs to the supplied team and its first status-list
read succeeded, reuse that list instead of reading it again. When that first
read failed and the current issue still has the same team, return the original
provider failure without retrying it. Normalize the supplied current status on
direct reuse, or the returned issue status after fallback, against the
applicable status list.

Return the current and available statuses as `id`, `name`, and `category`:

- `completed`: Linear type `completed`, or a clear done or completed name;
- `review`: name clearly identifies review;
- `active`: Linear type `started`, excluding review;
- `other`: every remaining status.

Return the provider failure when any required fallback read or normalization
fails.

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
