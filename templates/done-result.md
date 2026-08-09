# Done Result

Use when `/done` completes or stops after a blocked, unsupported, failed, or
partial result.

## Format

```markdown
## Done Result

Request <provider, repository, and ID>: <merged, already merged, blocked, unsupported, failed, or unobserved>
Item <ID>: <transitioned, already done, not attempted, or failed with reason>

Remaining: <exact item transition; omit when none or merely blocked>
```

## Rules

- Report observed states rather than intended states.
- Keep both identities visible.
- Never report the item as transitioned after an unobserved merge.
