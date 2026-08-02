# Ready Preflight

Use after `/ready` passes validation and readiness assessment, before its one
mutation confirmation.

## Format

```markdown
## Ready for Promotion

Plan: <name and planId>
Validation: passed at <HEAD>
Readiness: ready — <concise justification>
Branch: <branch> → <upstream ref> (<ahead count> commits to push)
Request: <kind, ID, URL, description action, draft action>
Item: <best-effort review transition or not available>

### Exact Request Body

<exact body from request-description.md>

### Mutations After Confirmation

- <normal branch push, only when needed>
- <description replacement, only when needed>
- <draft removal, only when needed>
- <best-effort item transition, only when available>
```

## Rules

- Show exact refs, request identity, proposed body, and mutations.
- Omit already-satisfied mutation lines.
- Label the item transition best-effort and non-blocking.
- Leave confirmation to the workflow's following `select-option.md` call.
