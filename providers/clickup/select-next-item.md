# Select Next Item: ClickUp

## List

```text
tool: clickup_filter_tasks
arguments:
  tags: [agent-shaped]
  include_closed: false
  page: caller continuation when present
```

Normalize `next_page` to `next` and tag names to `labels`. Return
`status: open`; the compact response has no `created_at`.

## Read

```text
tool: clickup_get_task
arguments:
  task_id: candidate ID
```

Normalize tag names to `labels`, `date_created` to `created_at`, and
`date_closed: null` to `status: open`; otherwise return `status: ineligible`.
Return the task's `id`, `name`, and `url`.
