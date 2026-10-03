# Select Next Item: Linear

```text
tool: list_issues
arguments:
  label: agent-shaped
  state: Backlog
  includeArchived: false
  limit: 1
  fields: [id, title, url]
```

Return the first issue's `id`, `title` as `name`, and `url`, or no match when
the result is empty.
