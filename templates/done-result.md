# Done Result

Use when `/done` completes or stops after a blocked, unsupported, failed, or
partial result.

## Format

```markdown
## Done result

**Request <provider/repository#ID>:** <observed request result>
**Item <ID>:** <observed item result>

**Remaining:** <exact request or item action; omit when none or no actionable next step is known>
```

## Rules

- Report observed states rather than intended states.
- Lead with the observed request and item results without another subheading.
- Keep both identities visible.
- Include `Remaining` only when the workflow supplies one exact actionable
  mutation.
