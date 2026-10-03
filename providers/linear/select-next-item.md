# Select Next Item: Linear

## List

```text
tool: list_issues
arguments:
  label: agent-shaped
  includeArchived: false
  limit: 250
  fields: [id, title, url, createdAt, status, statusType, labels]
  cursor: caller continuation when present
```

Normalize `hasNextPage` to `has_more`, `cursor` to `next`, `title` to `name`,
and `createdAt` to `created_at`.

## Read

```text
tool: get_issue
arguments:
  id: candidate ID
```

Return the same normalized fields. In both operations, set `status` to
`ineligible` for `completed`, `canceled`, or `duplicate` status types or a
status named `duplicate` (case-insensitive); otherwise set it to `open`.
