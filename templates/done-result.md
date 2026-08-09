# Done Result

Use when `/done` completes or stops after a blocked, unsupported, failed, or
partial result.

## Format

```markdown
## Done Result

Request <kind, ID, and URL>: <merged, already merged, blocked, unsupported, failed, or unobserved>
Item <ID>: <transitioned, already done, not attempted, or failed with reason>

Remaining action:

- <only the action still required; omit when complete or merely blocked>
```

## Rules

- Report observed states rather than intended states.
- Keep the exact request and item identities visible in every result.
- Never report the item as transitioned after an unobserved merge.
- Keep recovery to the action remaining on an explicit rerun.
