# Select Option

Use this template when the developer must choose exactly one option from a short
list.

## Contract

- When the AI tool provides a native single-selection control, use that control
  to ask the question. Do not render the options as a plain Markdown list first.
- Use a compact text question only when no native single-selection control is
  available.
- Allow exactly one selected option.
- Keep option labels exactly as written by the workflow.
- Do not add descriptions unless required by the workflow or native UI.

## Inputs

- question: short prompt shown to the developer.
- options: exact option labels provided by the workflow.

Use this shape when a workflow calls the template:

```text
question: <question>
options:
- <option label>
- <option label>
```

## Labels

Use readable labels for the developer.

When options come from external systems, keep technical identifiers internal.
