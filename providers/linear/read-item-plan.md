# read-item-plan

```text
tool: list_comments
arguments:
  issueId: item ID or identifier
  limit: 250
  cursor: next cursor when present
```

Follow every cursor until a comment beginning with the exact marker from
`../../templates/item-plan-comment.md` is found or no page remains. Return the
complete content after the marker and required blank line as `plan_content`.
