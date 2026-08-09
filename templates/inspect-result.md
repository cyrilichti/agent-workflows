# Inspect Result

Bind one explicit inspection result to the frozen request snapshot.

## Format

```markdown
## Inspect Result

Head SHA: <observed SHA or unavailable>
Status: <complete or incomplete>
Missing context: <exact reason; incomplete only>

Findings: <none or every complete finding in stable order; complete only>
```

## Rules

- `complete` requires the exact frozen SHA and explicit `Findings: none` or
  findings following `./inspect-finding.md` after applying the active method.
- `incomplete` requires `Missing context` and contains no findings.
- Never infer `Findings: none` from empty, missing, partial, or truncated output.
- Keep this validation envelope internal; only findings enter user curation.
