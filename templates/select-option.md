# Select Option

Use this template when the user must choose exactly one option from a short
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
* Localize authored questions and option labels according to
  `../rules/default-language.md`. Preserve their meaning rather than reproducing
  their wording exactly.
* Return the selected option value to the caller when values are provided.
* Do not add descriptions unless required by the workflow or native UI.
* Use readable labels for the user.
* Keep text originating from external systems, such as backlog item titles,
  unchanged unless the system provides a localized form.
* Keep technical identifiers and internal option values unchanged and do not
  expose them in labels.
