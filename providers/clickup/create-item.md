# create-item

Serialize the confirmed item sections as Markdown, then create the task:

```text
tool: clickup_create_task
arguments:
  list_id: selected destination ID
  name: confirmed title
  markdown_description: confirmed free-form Markdown body
```

Omit assignment and status so the caller can handle them separately.
