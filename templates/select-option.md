# Select Option

Use this template when the developer must choose exactly one option from a short
list.

## Format

Workflow input:

```text
question: <question>
options:
- <option label>
- <option label>
```

When the caller provides internal values, keep them attached to their labels:

```text
question: <question>
options:
- label: <option label>
  value: <internal value>
- label: <option label>
  value: <internal value>
```

Native output:

Use the AI tool's native single-selection control when available.

Text fallback:

```markdown
<question>

- <option label>
- <option label>
```

## Rules

* Use the native single-selection control when available. Do not render the
  options as a plain Markdown list first.
* Use the text fallback only when no native single-selection control is
  available.
* Allow exactly one selected option.
* Keep option labels exactly as written by the workflow.
* Return the selected option value to the caller when values are provided.
* Do not add descriptions unless required by the workflow or native UI.
* Use readable labels for the developer.
* When options come from external systems, keep technical identifiers internal.
