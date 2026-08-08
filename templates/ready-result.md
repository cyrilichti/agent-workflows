# Ready Result

Use after `/ready` attempts promotion.

## Format

```markdown
## Promotion Result

Branch: <pushed, already current, or failed>
Request: <description updated or already current>; <ready or failed>
Item: <moved to review, unchanged with reason, or not available>

Remaining: <exact action, only when required>
```

## Rules

- Report observed mutation results, not intended state.
- Omit the item or remaining line when it does not apply.
- Include the exact request body only when it must be applied manually.
- Do not reread state already established by a successful verified command.
