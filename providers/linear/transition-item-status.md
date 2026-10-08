# Transition Item Status

## Read

When the caller supplies an official item with a current status and team
destination, reuse those fields. Otherwise read the issue:

```text
tool: get_issue
arguments:
  id: caller item ID or identifier
```

Then list the destination team's statuses:

```text
tool: list_issue_statuses
arguments:
  team: supplied or returned issue team name or ID
```

Match the current status to the listed statuses to normalize its `id`, `name`,
and `category`. When the supplied status or destination no longer matches the
provider result, read the issue once and normalize from that current record.

Return the current and available statuses as `id`, `name`, and `category`:

- `completed`: Linear type `completed`, or a clear done or completed name;
- `review`: name clearly identifies review;
- `active`: Linear type `started`, excluding review;
- `other`: every remaining status.

Return the provider failure when any required provider read fails.

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
