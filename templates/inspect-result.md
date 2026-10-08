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
- Use `inspection published` and `agent-inspected applied` for confirmed success.
- The `agent-inspected` label may use inline code formatting. Keep additional
  context after the result block; when adding a short comment to a result line,
  separate it from the confirmation with a dash.
- Include `Remaining` only when the workflow supplies one exact actionable
  mutation.
