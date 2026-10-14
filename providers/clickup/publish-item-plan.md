# publish-item-plan

Wrap only the plan content in a `markdown` code block, keeping the marker and
blank line from `../../templates/item-plan-comment.md` outside. Use at least
three backticks, more than any consecutive backtick sequence in the plan.
Add one newline on each side of the exact plan content inside the fence.

```text
tool: clickup_create_comment
arguments:
  entity_type: task
  entity_id: item ID
  comment_text: plan comment with only its plan content wrapped as above
```

Return the created comment result.
