# Inspect Result

Bind one explicit inspection result to the frozen request snapshot.

## Format

```markdown
## Inspection <complete or incomplete>

**Head SHA:** <observed SHA or unavailable>
**Missing context:** <exact reason; incomplete only>

**Findings:** <none or every complete finding in stable order; complete only>
```

## Rules

- Put the observed `complete` or `incomplete` status directly in the H2.
- `complete` requires the exact frozen SHA and explicit `Findings: none` or
  findings following `./inspect-finding.md` after applying the active method.
- `incomplete` requires `Missing context` and contains no findings.
- Never infer `Findings: none` from empty, missing, partial, or truncated output.
