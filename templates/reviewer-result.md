# Reviewer Result

Bind one explicit review result to the frozen request snapshot.

## Format

```markdown
## Reviewer Result

Head SHA: <observed SHA or unavailable>
Status: <complete or incomplete>
Coverage: <intent, tests, correctness, readability, architecture, security, performance; complete only>
Missing context: <exact reason; incomplete only>

Findings: <none or every complete finding in stable order; complete only>
```

## Rules

- `complete` requires the exact frozen SHA, every named coverage area, and
  explicit `Findings: none` or findings following `./review-finding.md`.
- `incomplete` requires `Missing context` and contains no findings.
- Never infer `Findings: none` from empty, missing, partial, or truncated output.
