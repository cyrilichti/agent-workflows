# Reviewer Result

Return one complete review result bound to the frozen request snapshot.

## Input

- frozen head SHA;
- complete official item and review snapshot;
- zero or more findings following `./review-finding.md`.

## Format

For a complete review:

```markdown
## Reviewer Result

Head SHA: <exact frozen head SHA>
Status: complete
Coverage: intent, tests, correctness, readability, architecture, security, performance

Findings: none
```

Replace `Findings: none` with every complete finding in stable order when
findings exist.

For an incomplete review:

```markdown
## Reviewer Result

Head SHA: <observed head SHA or unavailable>
Status: incomplete
Missing context: <exact missing, partial, stale, or unreadable context>
```

## Rules

- Use `complete` only after examining every named coverage area against the
  supplied snapshot.
- Use `Findings: none` explicitly when the complete review found no issue.
- Never represent an empty, omitted, partial, or truncated response as no
  findings.
- An `incomplete` result is not publishable; do not include provisional
  findings in it.
- Every returned finding must satisfy `./review-finding.md`.
