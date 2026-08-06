# Write Result

Use when `/write` finishes after a successful save.

## Format

```markdown
## Write Result

Item: <markdown link with the item title as label, or Unavailable>
Status: <returned or carried provider status, or Unavailable>
Assignment: <observed assignee names, Unassigned, or Unavailable>
```

## Rules

- Report observed states rather than intended states.
- Prefer a titled markdown link for `Item`; never show a raw URL alone.
- Never echo internal tokens such as `me` in `Assignment`.
