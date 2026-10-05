# Select Next Item: ClickUp

```text
tool: clickup_filter_tasks
arguments:
  tags: [agent-planned]
  include_closed: false
```

Return the first task's `id`, `name`, `url`, and list name as `list`, or no match
when the first page is empty. A missing list name is an error.
