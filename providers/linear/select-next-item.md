# Select Next Item: Linear

```text
tool: list_issues
arguments:
  label: agent-planned
  includeArchived: false
  limit: 250
  fields: [id, title, url, project, status, statusType, labels, updatedAt]
```

Use Linear's native `statusType`: `backlog` and `unstarted` map to waiting to
start. A native type of `started` maps to review when its name clearly
identifies review. Other `started` statuses are work in
progress. Use native types for waiting states; a custom
status named `Open` with type `started` does not qualify. Skip missing or other
types, including `triage`, `completed`, `canceled`, and `duplicate`.

Return the first page as normalized candidates, preserving provider order:

- `name`, `id`, `url`, `list`: title, issue ID, URL, and project name;
- `status_category`: `waiting`, `review`, or `other` from the mapping above;
- `labels`: the complete array of exact label names;
- `updated_at`: `updatedAt` converted from ISO-8601 with an explicit UTC
  offset to epoch milliseconds.

Represent absent or malformed label collections and timestamps as `null`.
Preserve a missing destination as `null`. Return the provider failure when the
selection call fails.
