# Write Result

Use when `/write` finishes after a successful save.

## Format

```markdown
## <item title, or Write result unavailable>

[Open in <provider display name> ↗](<item URL>)

- **Status:** <returned or carried provider status, or Unavailable>
- **Label:** <agent-shaped applied, or agent-shaped not applied with reason>
```

## Rules

- Report observed states rather than intended states.
- Use the item title as the H2 conclusion heading. Use `Write result unavailable`
  when the title is unavailable.
- When the item URL is available, show one `Open in <provider> ↗` link on its
  own line. Never show a raw URL.
- Omit the link when the item URL is unavailable.
