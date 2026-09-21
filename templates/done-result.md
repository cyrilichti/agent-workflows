# Done Result

Use when `/done` completes or stops after a blocked, unsupported, failed, or
partial result.

## Format

```markdown
## Done Result

Request <provider/repository#ID>: <observed request result>
Item <ID>: <observed item result>

Remaining: <exact request or item action; omit when none or no actionable next step is known>
```

## Rules

- Report observed states rather than intended states.
- Keep both identities visible.
- When `agent-inspected` is missing, report an open request as not attempted
  and still awaiting inspection, or preserve the observed merged state while
  reporting its missing inspection evidence. Report the item as waiting for
  `agent-inspected`, omit `Remaining`, and do not prescribe another workflow.
- Never report the item as transitioned after an unobserved merge.
- After an observed merge, only the item transition may remain.
