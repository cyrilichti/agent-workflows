# Done Result

Use when `/done` completes or stops after a blocked, unsupported, failed, or
partial result.

## Format

```markdown
## Done Result

Request <provider/repository#ID>: <observed request result>
Item <ID>: <observed item result>

Remaining: <exact item transition; omit when none or merely blocked>
```

## Rules

- Report observed states rather than intended states.
- Keep both identities visible.
- Never report the item as transitioned after an unobserved merge.
