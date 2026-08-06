# ClickUp Provider

## retrieve-items

Retrieve ClickUp tasks matching the caller's criteria.

### Current User

1. Resolve the current user to ClickUp user IDs:

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

### Status Criteria

Use `clickup_filter_tasks` with the caller's resolved `statuses`. Do not pass
`assignees` unless the caller requested them. Follow every returned page and
fail rather than returning a partial result.

## resolve-item-status

Use `clickup_get_workspace_hierarchy` with `max_depth: "2"` and return every
status name that clearly matches `semantic_status`. If the hierarchy does not
expose statuses, report resolution as unavailable. Do not retrieve tasks.

## create-child-item

Create the confirmed item as a subtask in the official parent task's List:

```text
tool: clickup_create_task
arguments:
  list_id: official parent destination List ID
  parent: official parent task ID
  name: confirmed child title
  markdown_description: confirmed child free-form Markdown body
```

Use the List ID from the official parent context. Do not resolve or select
another List. Omit assignment, status, labels, and other optional fields. This
operation creates only the child task and must not update the parent task.

## create-blocking-relations

For every blocking child task ID supplied by the caller, create one directional
dependency:

```text
tool: clickup_add_task_dependency
arguments:
  task_id: blocked child task ID
  depends_on: blocking child task ID
  type: waiting_on
```

`waiting_on` means `task_id` cannot start until `depends_on` is complete. Do
not invert these IDs and do not use `blocking`.

Use only the child task IDs supplied by the caller. Do not search for tasks or
provider documentation and do not inspect tool schemas at runtime. Do not use
`clickup_add_task_link`, because it creates a non-blocking association.

Create no other relationship and do not update either child task or their
official parent.

## transition-item-status

Resolve and update a ClickUp task status.

1. Read the task and its available statuses:

   ```text
   tool: clickup_get_task
   arguments:
     task_id: caller item ID
     expand_statuses: true
   ```

   For `in progress`, stop if this read fails. For `review` or `done`, return a
   non-transitioned best-effort result with the provider failure as its reason.

2. Resolve the caller's normalized target by case-insensitive status name and
   ClickUp status type:
   - for `in progress`, prefer an exact `in progress` name or the single
     non-review active-work equivalent;
   - for `review`, keep only statuses whose name clearly identifies review; do
     not substitute an active-work status or create a status;
   - for `done`, return a successful no-op when the current status has a done or
     closed semantic type. Otherwise, keep only available statuses whose type
     or name clearly means done, completed, or closed.
3. For `in progress`, stop when no status matches and ask the user to select
   one when multiple statuses match equally.
4. For `review` or `done`, continue only when exactly one matching status
   exists. For zero or multiple matches, do not mutate and do not ask the user
   to choose.
5. For `done` with `mode: resolve`, return the current status,
   `already_at_target`, and the resolved target without mutation. For
   `mode: apply`, require a caller-supplied resolved target to remain the exact
   selected available status.
6. Update only the task status when the preceding rules selected one status in
   apply mode:

   ```text
   tool: clickup_update_task
   arguments:
     task_id: caller item ID
     status: resolved workspace status name
   ```

7. For `in progress`, return the updated task status and stop on failure.
8. For `review` or `done`, return a best-effort result containing:
   - `transitioned`: `true` only when the update succeeded;
   - `previous_status`: the status read in Step 1 when available;
   - `target_status`: `review` or `done`;
   - `resolved_target_status`: the single matched status when available;
   - `resulting_status`: the updated status when returned or confirmed;
   - `reason`: required when `transitioned` is `false`, including read failure,
     no match, ambiguous matches, or update failure.

For `done`, also return `already_at_target: true` for the successful no-op and
`false` otherwise. Do not let a non-transitioned `review` result block request
promotion or a non-transitioned `done` result hide an already completed merge.

Do not pass name, description, assignees, dates, priority, custom fields, task
type, or any other optional `clickup_update_task` field.

## add-request-backlink

```text
tool: clickup_create_comment
arguments:
  entity_type: task
  entity_id: item ID
  comment_text: exact caller-provided backlink comment
  notify_all: false
```

Create only the comment. Do not update item status or any other item field.
Use this operation only after creating a new request and never during resumed
work.
