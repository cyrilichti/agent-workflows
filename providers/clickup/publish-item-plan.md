# publish-item-plan

Wrap only the plan content in a `markdown` code block, keeping the marker and
blank line from `../../templates/item-plan-comment.md` outside. Use at least
three backticks, more than any sequence in the plan, and add one newline on
each side of the exact content inside the fence.

```text
clickup-cli comment create --task <item ID> --text <exact wrapped plan comment> --output json
```

Pass the exact comment as one argument, without `--markdown`, to preserve its
literal marker and fences. Return the created comment result.
