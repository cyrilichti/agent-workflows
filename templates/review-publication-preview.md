# Review Publication Preview

Present the exact complete review payload before publication.

## Input

- resolved request and frozen head SHA;
- accepted current findings;
- ordered publication operations;
- optional terminal verdict;
- unsupported operations.

## Format

```markdown
## Review Publication Preview

Request: <request ID and URL>
Head SHA: <frozen head SHA>

### Finding <stable local ID>

Target: <inline file:line or request comment>
Operation: <publish or unsupported>

<exact comment body>

### Terminal Verdict

Verdict: <request changes, approve, or none>
Operation: <publish or unsupported>

### Unsupported Operations

- <exact unsupported operation and reason>
```

Repeat the finding section in stable publication order.

## Rules

- Show the exact complete payload, targets, and verdict.
- Omit `Unsupported Operations` when empty.
- Do not imply that any operation has occurred.
- Do not publish or ask for partial confirmation from this template.
