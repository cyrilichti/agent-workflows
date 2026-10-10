# Select Next Item: Linear

```text
tool: list_issues
arguments:
  label: agent-planned
  includeArchived: false
  limit: 250
  fields: [id, title, url, project, status, statusType]
```

Apply the eligibility contract in `../../commands/select-next-item.md` using
Linear's native `statusType`: `backlog` and `unstarted` map to waiting to
start. Use the native type rather than the display name; a custom status named
`Open` with type `started` does not qualify. Skip missing or other types,
including `triage`, `started`, `completed`, `canceled`, and `duplicate`.

From the first returned page, select the first qualifying issue in provider
order. Return its `id`, `title` as `name`, `url`, and project name as `list`.
Return no match when that page has no qualifying issue. A missing project name
on the selected issue is an error.
