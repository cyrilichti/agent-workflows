# read-item


```text
tool: clickup_get_task
arguments:
  task_id: item ID
  include:
    - description
```

Return the task's core fields, full description, list hierarchy, assignees, and
URL.

Add supported `include` values such as `attachments` or `linked_tasks` when the
caller requests them. When comments are requested, call
`clickup_get_task_comments` with the same task ID.

For `request_backlinks`, call `clickup_get_task_comments`, follow every returned
continuation until no next page remains, and return every `Draft PR:` or
`Draft MR:` URL. If a comments page fails or is truncated, stop without
returning the item.
