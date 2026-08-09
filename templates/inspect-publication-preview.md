# Inspect Publication Preview

Present the exact complete inspection payload before publication.

## Format

```markdown
## Inspect Publication Preview

Request: <request ID and URL>
Head SHA: <frozen head SHA>
Semantic verdict: <request_changes, approve, or none>
Delivery: one grouped provider review

Findings: <none or each exact finding body with its inline anchor or grouped-body target>
```

## Rules

- Show findings in stable order with every exact body and target.
- A provider may use a required transport event, such as GitHub `COMMENT` for
  `none`, without changing the confirmed semantic verdict.
- Do not imply publication or support partial confirmation.
