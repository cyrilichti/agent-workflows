# Review Finding

Present one complete review finding for an explicit user decision.

## Input

- stable local ID;
- severity: `blocking` or `non-blocking`;
- file and line only when supported by valid snapshot anchor data;
- concrete problem;
- impact;
- verifiable reasoning tied to snapshot evidence;
- recommended direction without a code correction.

## Format

```markdown
## Finding <stable local ID>

Severity: <blocking or non-blocking>
Location: <file:line, only when anchored>

Problem: <concrete problem>

Impact: <user or system impact>

Reasoning: <verifiable snapshot evidence>

Direction: <recommended direction without a code correction>
```

Then ask through `./select-option.md`:

```text
question: What do you want to do with this finding?
options:
- Accept
- Reject
- Modify
```

## Rules

- Show every schema field and preserve its complete current value.
- Omit `Location` when no valid snapshot anchor exists.
- On `Modify`, collect free-form changes without applying them in the template.
- Do not combine findings or support a partial decision.
- Normalize reviewer classifications before returning a finding:
  - `Critical` and `Required`, including an unprefixed required change, become
    `blocking`;
  - `Optional` and `Consider` become `non-blocking` only when they satisfy the
    complete finding schema;
  - `Nit` and `FYI` are not publishable findings and must be omitted.
- Return only the normalized `blocking` or `non-blocking` severity, never the
  source classification.
