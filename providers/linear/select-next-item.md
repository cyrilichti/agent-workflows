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
start. A native type of `started` maps to review only when the trimmed,
case-insensitive whole status name is `Review` or `In Review`. Other `started`
statuses are work in progress. Use native types for waiting states; a custom
status named `Open` with type `started` does not qualify. Skip missing or other
types, including `triage`, `completed`, `canceled`, and `duplicate`.

Use the complete `labels` array of exact label names and normalize `updatedAt`
as an ISO-8601 timestamp with an explicit UTC offset to epoch milliseconds.
Reject absent, null, or malformed required fields according to the shared
selection contract in `../../commands/select-next-item.md`.

Apply that contract to the first returned page. Return the selected issue's
`id`, `title` as `name`, `url`, and project name as `list`. A missing project
name on the selected issue is an error.
