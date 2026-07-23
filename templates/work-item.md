# Work Item

Use this template when transferring one proposed backlog item from the
`work-item-writer` to the calling workflow.

## Format (Markdown)

```markdown
## Title

<work item title>

## Body

<free-form Markdown adapted to the nature of the item>

## Workflow Metadata

Skills used: <comma-separated Skill names>
```

## Persisted Content

Only the following fields belong to the provider-backed item:

- `Title`: the provider title;
- `Body`: the provider description, preserved as Markdown.

The body has no mandatory internal sections. Structure it according to the
actual item rather than forcing a bug, improvement, debt item, epic, idea, or
specification into a shared schema.

## Workflow Metadata

`Skills used` records the Skills that contributed to the proposal. Keep it
concise and separate from the title and body.

This metadata is internal to the workflow. Do not display it as item content or
send it to the provider.

## Rules

- Return exactly one item.
- Provide a concise, meaningful title.
- Provide a free-form Markdown body containing the useful result of the writing
  process.
- Do not require Objective, Business Context, Acceptance Criteria, or any other
  generic section.
- Do not include provider-specific fields such as ID, destination, type, status,
  labels, or assignee.
- Do not persist `Workflow Metadata`.
