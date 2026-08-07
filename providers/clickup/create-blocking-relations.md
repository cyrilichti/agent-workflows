# create-blocking-relations

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
