# Select Next Item: Linear

```text
tool: list_issues
arguments:
  label: agent-shaped
  state: Backlog
  includeArchived: false
  limit: 1
  fields: [id, title, url, project]
```

Return the first issue's `id`, `title` as `name`, `url`, and project name as
`list`, or no match when the result is empty. A missing project name is an
error.
