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
caller requests them. For comments or `request_backlinks`, call
`clickup_get_task_comments` once, follow every continuation, and return the
requested comments and `Draft PR:` or `Draft MR:` URLs. Stop when the result is
incomplete.
