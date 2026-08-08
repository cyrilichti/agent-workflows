# Ready Preflight

Use immediately before `/ready` asks for its single mutation confirmation.

## Format

```markdown
## Promotion Proposal

Plan: <name and planId> — validation passed; delivered work matches the plan
Branch: <branch> — <push required or already current>
Request: <kind, ID and URL> — <description action>; <draft action>
Item: <best-effort review transition, when available>
```

## Rules

- Keep the result compact and show every pending mutation.
- Do not display the prepared request body.
- Omit already-satisfied actions and the item line when no official item is
  available.
- Leave confirmation to the workflow.
