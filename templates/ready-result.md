# Ready Result

Use when `/ready` finishes or stops after a partial promotion.

## Format

```markdown
## Ready Result

Branch: <pushed and verified at HEAD, or exact current state>
Request description: <verified, manual action required, or failed>
Draft state: <ready, manual action required, or failed>
Item review: <transitioned, not transitioned with reason, or not available>

Remaining actions:

- <only actions still required; omit this section when complete>
```

## Rules

- Report observed final state, not intended state.
- Distinguish successful, manual, failed, and non-blocking item outcomes.
- Include the exact request body when manual description application is
  required.
- Keep partial-failure recovery concise and do not retry automatically.
- End without invoking `/review`.
