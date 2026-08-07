# Select Option

Use this template when the user must choose exactly one option.

Follow `../rules/default-language.md` for all user-facing output.

## Input

```text
question: <question>
options:
- <option label>
- label: <option label>
  value: <internal value>
```

Use labels directly by default. Add a value only when the caller needs hidden
data distinct from the label.

## Behavior

Use a native single-selection control only when it can present every option
without changing the choice or adding a recommendation.

Otherwise use this text fallback:

```markdown
<question>

1. <option label>
2. <option label>
```

Wait for exactly one selection. Return the caller's original option label, or
its internal value when one is provided. Do not expose internal values or
preselect an option.
