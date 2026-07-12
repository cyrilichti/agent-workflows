# ClickUp Provider

## retrieve-work-items

Retrieve ClickUp tasks assigned to a person.

### Current Developer

1. Resolve the current developer to ClickUp user IDs:

```text
tool: clickup_resolve_assignees
arguments:
  assignees:
    - me
```

2. Retrieve assigned tasks:

```text
tool: clickup_filter_tasks
arguments:
  assignees: resolved numeric user IDs
  include_closed: false
  subtasks: false
  order_by: updated
  reverse: true
```

3. Apply the caller criteria to the returned tasks when ClickUp cannot express
   them directly.

Use ClickUp status names as workspace-specific values. Do not assume every
workspace uses the same status labels.

Do not call `clickup_search` for this operation when `clickup_filter_tasks` can
retrieve the requested tasks.
