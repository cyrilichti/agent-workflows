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

## Rules

- Return exactly one item.
- Provide a concise, meaningful title.
- Provide a free-form Markdown body containing the useful result of the writing
  process.
- Do not require Objective, Business Context, Acceptance Criteria, or any other
  generic section.
- Do not include provider-specific fields such as ID, destination, type, status,
  labels, or assignee.
