# Request Description

Use to prepare the exact pull-request or merge-request body during `/ready`.

## Format

```markdown
## Summary

<concise summary of the completed change from the plan and diff>

## Validation

- <plan validation check and observed successful result>

Item: [<official item ID>](<official item URL>)
Agent-Workflows-Plan: <planId>
```

## Rules

- Use only facts established by the plan, complete diff, and validation run.
- Keep the summary concise and describe the delivered outcome, not the agent's
  process.
- Include every global validation check that was actually completed.
- Include the linked `Item` line only when the official item URL is available;
  otherwise omit it.
- Preserve the exact `planId`.
- Do not add a requirement matrix, review verdict, smoke test, reviewer,
  deployment claim, or unchecked assertion.
- Return one exact body without surrounding commentary.
