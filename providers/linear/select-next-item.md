# Select Next Item: Linear

```text
tool: list_issues
arguments:
  label: agent-shaped
  includeArchived: false
  limit: 250
  fields: [id, title, url, project, status]
```

From the returned page, select the first issue whose status name is `Backlog`
or `Open`. Return its `id`, `title` as `name`, `url`, and project name as
`list`. Return no match when the page has no eligible issue. A missing project
name is an error.
