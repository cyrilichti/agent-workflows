# create-child-item

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
