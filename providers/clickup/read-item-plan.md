# read-item-plan

```text
tool: clickup_get_task_comments
arguments:
  task_id: item ID
  start: continuation timestamp when present
  start_id: continuation comment ID when present
```

Follow every continuation until a comment beginning with the exact marker from
`../../templates/item-plan-comment.md` is found or no page remains. Return the
complete content after the marker and required blank line as `plan_content`.
