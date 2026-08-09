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
Prior findings: none

Findings: none
```

Replace `Findings: none` with every complete finding in stable order when
findings exist. On a rerun, replace `Prior findings: none` with:

```markdown
Prior findings:

- <persistent ID>: open
- <persistent ID>: resolved — <snapshot evidence>
- <persistent ID>: obsolete — <reason>
```

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
- Reconcile every prior `RF-` finding ID from review activity exactly once.
- An `open` prior finding must appear once in `Findings` with the same ID.
- A `resolved` or `obsolete` prior finding must not appear in `Findings`.
- A reply, resolved thread, or prior verdict is not snapshot evidence that a
  finding is resolved.
- An `incomplete` result is not publishable; do not include provisional
  findings in it.
- Every returned finding must satisfy `./review-finding.md`.
