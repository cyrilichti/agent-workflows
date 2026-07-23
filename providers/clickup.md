# ClickUp Provider

## retrieve-items

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

## search-items

Search tasks by developer-provided title text:

```text
tool: clickup_search
arguments:
  keywords: caller query
  filters:
    asset_types:
      - task
  count: 20
```

Prefer results whose names match the query. Return task ID, name, status, URL,
and hierarchy. Do not paginate unless the developer refines the search.

## read-item

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

## list-destinations

```text
tool: clickup_get_workspace_hierarchy
arguments:
  max_depth: "2"
```

Only Lists are valid creation destinations. Return each List with a readable
`Space / Folder / List` path and its List ID. Continue pagination only when
needed to resolve the developer's requested destination.

## resolve-assignees

For `me` or an exact name or email:

```text
tool: clickup_resolve_assignees
arguments:
  assignees:
    - caller query
```

When a readable member record or disambiguation is needed, use
`clickup_find_member_by_name`. If the name is ambiguous, use
`clickup_get_workspace_members` and post-filter by the query rather than asking
the developer for a numeric ID.

## create-item

Serialize the confirmed item sections as Markdown, then create the task:

```text
tool: clickup_create_task
arguments:
  list_id: selected destination ID
  name: confirmed title
  markdown_description: confirmed free-form Markdown body
```

Omit assignment and status so the caller can handle them separately.

## update-item

```text
tool: clickup_update_task
arguments:
  task_id: item ID
  name: confirmed title, when changed
  markdown_description: confirmed free-form Markdown body, when changed
```

Omit every field that the developer did not confirm changing.

## assign-item

```text
tool: clickup_update_task
arguments:
  task_id: item ID
  assignees:
    - selected numeric user ID
```

Do not include other update fields.

## update-item-status

Update a ClickUp task status.

```text
tool: clickup_update_task
arguments:
  task_id: item ID
  status: target status
```

Use the status provided by the caller.
