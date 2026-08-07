# add-request-backlink

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
