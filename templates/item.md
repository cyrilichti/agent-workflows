# Item

Use this template when transferring one proposed item from the `item-writer`
to the calling workflow.

## Format (Markdown)

```markdown
## Title

<item title>

## Body

<free-form Markdown adapted to the nature of the item>
```

## Persisted Content

Only the following fields belong to the provider-backed item:

- `Title`: the provider title;
- `Body`: the provider description, preserved as Markdown.

The body has no mandatory internal sections. Structure it according to the
actual item rather than forcing a bug, improvement, debt item, epic, idea, or
specification into a shared schema.
