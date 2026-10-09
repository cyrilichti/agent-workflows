# Inspect Result

Use whenever `/inspect` completes or stops after resolving the exact request
and official item.

## Format

```markdown
## Inspect result

**Request <provider/repository#ID>:** <request status>
**Item <ID>:** <item status>

**Remaining:** <exact request or item action; omit when none or no actionable next step is known>
```

## Rules

- This result block is a fixed output contract. Copy the heading and field
  names literally. Copy one status from the lists below exactly in English,
  regardless of the response language. Do not translate, paraphrase, format,
  or add comments inside a status. Put explanations after the result block.
- Request statuses: `inspection published`, `inspection completed without findings`,
  `inspection incomplete`, `inspection failed`, `inspection not attempted`,
  `unobserved`.
- Item statuses: `agent-inspected applied`, `agent-inspected not applied`,
  `unobserved`.
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
- Use `inspection published` only for observed complete finding publication.
  Use `inspection completed without findings` for complete inspection with no
  findings and no publication. Pair either with `agent-inspected applied` for
  confirmed success.
- Include `Remaining` only when the workflow supplies one exact actionable
  mutation.
