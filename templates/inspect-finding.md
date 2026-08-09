# Inspect Finding

## Format

```markdown
## Finding <RF-###>

Severity: <blocking or non-blocking>
Location: <file:line; omit without a valid snapshot anchor>

Problem: <concrete problem>

Impact: <user or system impact>

Reasoning: <relevant item expectation and verifiable snapshot evidence>

Direction: <recommended direction without a code correction>
```

## Rules

- Require every field except conditional `Location`.
- Tie the problem to the official item's requested outcome or acceptance
  criteria, unless the inspected change introduces a concrete defect or
  regression outside that scope.
- Preserve an ID while its problem and impact remain the same, even when its
  wording or anchor changes.
- Give the first finding `RF-001`, then use the next integer after the highest
  prior ID; never reuse an ID for another problem.
- Normalize `Critical`, `Required`, and unprefixed required changes to
  `blocking`; normalize complete `Optional` and `Consider` findings to
  `non-blocking`; omit `Nit` and `FYI`.
