# read-item-plan

```text
tool: clickup_get_task_comments
arguments:
  task_id: item ID
```

Read the complete content after the marker and required blank line from the
comment identified by `../../templates/item-plan-comment.md`.

Remove only the outer `markdown` fence and the separator newline on each side
added by `./publish-item-plan.md`. Return the resulting content
unchanged as `plan_content`.
