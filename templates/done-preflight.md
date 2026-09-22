# Done Preflight

Use before `/done` asks for its one mutation confirmation.

## Format

```markdown
**Ready to complete**

Request: <provider, repository, ID, source branch, target branch>
Request state: <observed state at head SHA>
Item: <ID and observed or resolved state>

**After confirmation**

- <first remaining mutation>
- <second remaining mutation, when applicable>
```

## Rules

- Show exact identities, observed states, merge method, and resolved item
  target supplied by the workflow.
- Use bold inline labels rather than section headings.
- List only remaining mutations.
- Leave confirmation to the workflow's following `select-option.md` call.
