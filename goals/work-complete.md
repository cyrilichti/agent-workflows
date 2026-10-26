# Work Complete

## Outcome

Execute one authoritative plan in `new` or `resumed` mode, maintaining its
`Delivery Context`.

## Terminal Outcomes

- Completed: no todo is `pending` or `in_progress`, at least one is `completed`,
  and the current `Delivery Context` is reported.
- Cancelled: every todo is `cancelled`; report no completed work.
- Stopped: report the exact failed operation or unmet precondition without
  claiming an unobserved change.

## Result Format

Start the final response with this block. Use the exact official item ID and
one status from `completed`, `cancelled`, or `stopped`. Put details after the
block.

```markdown
## Work result

**Item <ID>:** <status>
```
