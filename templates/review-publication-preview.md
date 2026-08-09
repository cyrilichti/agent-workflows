# Review Publication Preview

Present the exact complete review payload before publication.

## Input

- resolved request and frozen head SHA;
- accepted current findings;
- valid anchors when available;
- semantic verdict.

## Format

```markdown
## Review Publication Preview

Request: <request ID and URL>
Head SHA: <frozen head SHA>
Semantic verdict: <request_changes, approve, or none>
Delivery: one grouped provider review

### Finding <stable local ID>

Target: <inline anchor when valid or grouped review body>

<exact complete finding body>
```

Repeat the finding section in stable publication order.

## Rules

- Show every exact finding body, target, and the semantic verdict.
- A provider may use a required transport event, such as GitHub `COMMENT` for
  `none`, without changing the confirmed semantic verdict.
- Do not imply that any operation has occurred.
- Do not publish or ask for partial confirmation from this template.
