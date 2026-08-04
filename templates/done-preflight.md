# Done Preflight

Use before `/done` asks for its one mutation confirmation.

## Format

```markdown
## Ready to Complete

Request: <kind, ID, URL, source branch, target branch>
Request state: <open and mergeable at head SHA, or already merged>
Item: <ID and current state → resolved done state, or already done>

### Mutations After Confirmation

- <merge the request, only when still open>
- <transition the item, only when not already done>
```

## Rules

- Show the exact request and item identities plus their observed states.
- Show the exact resolved item target state.
- Omit already completed mutations.
- Leave confirmation to the workflow's following `select-option.md` call.
