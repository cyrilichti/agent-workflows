# Review Finding

Define one complete review finding.

## Input

- persistent finding ID in the form `RF-<positive integer padded to at least
  three digits>`, such as `RF-001`;
- severity: `blocking` or `non-blocking`;
- file and line only when supported by valid snapshot anchor data;
- concrete problem;
- impact;
- verifiable reasoning tied to snapshot evidence;
- recommended direction without a code correction.

## Format

```markdown
## Finding <persistent ID>

Severity: <blocking or non-blocking>
Location: <file:line, only when anchored>

Problem: <concrete problem>

Impact: <user or system impact>

Reasoning: <verifiable snapshot evidence>

Direction: <recommended direction without a code correction>
```

## Rules

- Show every schema field and preserve its complete current value.
- Omit `Location` when no valid snapshot anchor exists.
- Keep the same ID across snapshots while the underlying problem and impact
  remain the same, even when its wording, evidence, anchor, or line changes.
- Assign a new finding the next integer after the highest prior `RF-` ID in
  review activity. Never reuse an old ID for a different problem.
- Normalize reviewer classifications before returning a finding:
  - `Critical` and `Required`, including an unprefixed required change, become
    `blocking`;
  - `Optional` and `Consider` become `non-blocking` only when they satisfy the
    complete finding schema;
  - `Nit` and `FYI` are not publishable findings and must be omitted.
- Return only the normalized `blocking` or `non-blocking` severity, never the
  source classification.
