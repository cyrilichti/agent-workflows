# Inspect Result

Use whenever `/inspect` completes or stops after resolving the exact request
and official item.

## Format

```markdown
## Inspect result

**Request <provider/repository#ID>:** <observed inspection publication result>
**Item <ID>:** <observed label application result>

**Remaining:** <exact request or item action; omit when none or no actionable next step is known>
```

## Rules

- Report observed states rather than intended states.
- Use the same format for failures and incomplete outcomes. Report the
  publication outcome and label state actually observed. Use
  `agent-inspected not applied` when this run stopped before applying the label,
  and `unobserved` when an attempted operation's outcome could not be confirmed.
  Put failure details after the result block.
- Start the final response directly with `## Inspect result`, including when
  completing the `/work` delivery chain. Put any additional context after the
  result block.
- Lead with the observed request and item results without another subheading.
- Keep both identities visible.
- Identities may be plain text or Markdown links; keep the exact item ID in
  the link text.
- Use `inspection published` only when complete finding publication is observed
  for the final inspected snapshot. Use `inspection completed without findings`
  when the complete inspection has no findings and performs no publication.
  Pair either result with `agent-inspected applied` for confirmed success.
- Keep these status markers exactly as written in English. Put localized
  explanations after the result block.
- The `agent-inspected` label may use inline code formatting. Keep additional
  context after the result block; when adding a short comment to a result line,
  separate it from the confirmation with a dash.
- Include `Remaining` only when the workflow supplies one exact actionable
  mutation.

## Constrained Transport

When the caller supplies an inspection result schema, return the observed
states and explanation through that schema. The bridge validates the selected
item, classifies the delivery outcome, and renders the Markdown format above.
The schema and fixed status wording are owned by
`../src/bridge/execution/inspect-result.mjs`. Ordinary interactive workflows
continue to present this Markdown template directly.
