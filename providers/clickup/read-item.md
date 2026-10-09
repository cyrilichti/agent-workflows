# read-item

```text
tool: clickup_get_task
arguments:
  task_id: item ID
  include:
    - description
```

Return the task's core fields, full description, native status type or closed
indicator, list hierarchy, and URL. Return its assignees only when `assignment`
is requested. When `labels` are requested, return every current task tag name
from the same task response as exact labels.

When `eligibility` is requested, return the task's native status type and
closed-date indicator. Set `closed: true` when the native status type is
`closed` or the closed-date indicator is present; otherwise set
`closed: false`. Stop when neither native field is available.

Add supported `include` values such as `attachments` or `linked_tasks` when the
caller requests them. For comments or `request_backlinks`, call
`clickup_get_task_comments` once, follow every continuation, and return the
requested comments and `Draft PR:` or `Draft MR:` URLs. Stop when the result is
incomplete.
