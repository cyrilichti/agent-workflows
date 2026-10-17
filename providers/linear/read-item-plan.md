# read-item-plan

```text
linear issue comment list <item ID or identifier> --limit all --json --no-input
```

The CLI follows every comments page. Use the complete `body` of each JSON
comment; do not parse the terminal rendering or truncate long comments. Stop
when the command fails.

Return the complete content after the marker and required blank line from the
comment identified by `../../templates/item-plan-comment.md` as `plan_content`.
