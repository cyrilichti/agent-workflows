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

Return `closed: null` when neither the native status type nor closed-date
indicator is available. Otherwise, normalize `closed` to `true` when the type
is `closed` or a closed date is present, and `false` otherwise.

Add supported `include` values such as `attachments` or `linked_tasks` when the
caller requests them. For comments or `request_backlinks`, call
`clickup_get_task_comments` once, follow every continuation, and return the
requested comments and `Draft PR:` or `Draft MR:` URLs. Stop when the result is
incomplete.
