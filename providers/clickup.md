# ClickUp Provider

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
