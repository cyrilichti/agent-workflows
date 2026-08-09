# Inspect Publication Preview

Summarize the curated inspection result before publication without repeating
findings already decided by the user.

## Format

```markdown
## Inspect Publication Preview

Request: <request ID and URL>
Head SHA: <frozen head SHA>
Semantic verdict: <request_changes, approve, or none>
Delivery: one grouped provider review

Findings:
- Blocking: <count>
- Non-blocking: <count>
```

## Rules

- Derive both counts from the accepted findings in the locked publication
  payload; never display their bodies again.
- A provider may use a required transport event, such as GitHub `COMMENT` for
  `none`, without changing the confirmed semantic verdict.
- Do not imply publication or support partial confirmation.
