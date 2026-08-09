# Done Preflight

Use before `/done` asks for its one mutation confirmation.

## Format

```markdown
## Ready to Complete

Request: <provider, repository, ID, source branch, target branch>
Request state: <open and mergeable at head SHA, or already merged>
Item: <ID and current state → resolved done state, or already done>

### Mutations After Confirmation

- <squash-merge the request, only when still open>
- <transition the item, only when not already done>
```

## Rules

- Show exact identities, observed states, `squash`, and the resolved item
  target.
- Omit completed mutations.
- Leave confirmation to the workflow's following `select-option.md` call.
