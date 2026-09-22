# Done Preflight

Use before `/done` asks for its one mutation confirmation.

## Format

```markdown
**Ready to complete**

Request: <provider, repository, ID, source branch, target branch>
Request state: <open and mergeable at head SHA, or already merged>
Item: <ID and current state → resolved done state, or already done>

**After confirmation**

- <squash-merge the request, only when still open>
- <transition the item, only when not already done>
```

## Rules

- Show exact identities, observed states, `squash`, and the resolved item
  target.
- Use bold inline labels rather than section headings.
- Omit completed mutations.
- Leave confirmation to the workflow's following `select-option.md` call.
