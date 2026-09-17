# Select Option

Use this template when the user must choose exactly one option.

## Input

Callers pass a question and one option list. Use plain labels by default:

```text
question: <question>
options:
- <option label>
```

Use `label` and `value` only when the returned selection must carry hidden
data distinct from the displayed text:

```text
question: <question>
options:
- label: <option label>
  value: <internal value>
```

Do not mix the two option shapes in the same list.

## Behavior

Prefer a native single-selection control whenever one is available.

Otherwise use this text fallback:

```markdown
<question>

1. <option label>
2. <option label>
```

Wait for exactly one selection. Return the caller's original option label, or
its internal value when one is provided. Do not expose internal values or
preselect an option.
