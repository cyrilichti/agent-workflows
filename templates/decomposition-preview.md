# Decomposition Preview

Use this template when presenting a complete proposal for decomposing one
official parent item into multiple child items.

## Input

- `children`: two or more proposed children, each containing a stable local
  reference, one title, and one free-form Markdown body.
- `blocking_edges`: optional directed relationships between child references.

## Format (Markdown)

```markdown
## Proposed Decomposition

### 1. <child title>

<free-form Markdown body>

Blocked by: <number and title of each blocking child, when applicable>

### 2. <child title>

<free-form Markdown body>

Blocked by: <number and title of each blocking child, when applicable>
```

Repeat the child section for every proposal.

## Rules

- Present the complete decomposition in one preview.
- Preserve every child title and Markdown body without synthesizing or
  restructuring them.
- Number children in a stable order and resolve blocking edges to those
  readable numbers and titles.
- Omit `Blocked by` when a child has no blocking relationship.
- Keep blocking relationships outside the persisted child body.
- Do not display provider IDs, destinations, status, labels, assignees, or
  provider-specific parent fields.
- Do not imply that any child has been created.
- Keep any Skill or sub-agent announcement outside the preview.
