# Write Result

Use when `/write` finishes after a successful save.

## Format

```markdown
## Write Result

### <item title, or Item unavailable>

[Open in <provider display name> ↗](<item URL>)

- **Status:** <returned or carried provider status, or Unavailable>
- **Assignment:** <observed assignee names, Unassigned, or Unavailable>
```

## Rules

- Report observed states rather than intended states.
- Use the item title as a subheading, not as the link label.
- When the item URL is available, show one `Open in <provider> ↗` link on its
  own line. Never show a raw URL.
- Omit the link when the item URL is unavailable.
- Present status and assignment as separate list items so Markdown renderers do
  not collapse them onto one line.
- Never echo internal tokens such as `me` in `Assignment`.
