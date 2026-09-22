# Plan

Use for a Plan UI-compatible implementation plan proposal and its approved
persisted form.

## File

After approval, the workflow writes to:

```text
../plans/{YYYY-MM-DD}-{objective-slug}.plan.md
```

The workflow uses a lowercase kebab-case slug of at most 40 characters and
appends `-2`, `-3`, etc. when the filename exists. The author returns complete
content without creating a file; only the workflow persists the approved form.

## Format

```markdown
---
name: <short plan title>
overview: <one-line objective and approach>
todos:
  - id: <unique step slug>
    content: <one-sentence actionable step>
    status: pending
isProject: false
---

# <Plan title>

## Objective

<what must be achieved>

## Problem

<what must be solved and why it matters>

## Expected Outcome

<how success will be recognized>

## Steps

1. <exact first todo content>

## Validation

- [ ] <how the work will be checked>
```

## Frontmatter Rules

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes | Short title shown in Plan UI |
| `overview` | yes | One-line scope summary |
| `todos` | yes | One item per numbered step |
| `todos[].id` | yes | Unique kebab-case slug within the plan |
| `todos[].content` | yes | Exact corresponding step text |
| `todos[].status` | yes | `pending`, `in_progress`, `completed`, or `cancelled` |
| `todos[].source` | corrective only | Exact source metadata from `corrective-todo.md` |
| `isProject` | yes | `false` for one delivery unit |

## Rules

- Treat the project-relative `.plan.md` file path as the canonical plan
  reference. Do not store a separate identity in frontmatter.
- Do not persist a proposal before approval. Refinement, adjustment,
  abandonment, and failure create no executable plan file.
- Start every todo as `pending`. Later allow only `pending`, `in_progress`,
  `completed`, or `cancelled`, with at most one `in_progress`; cancellation
  requires explicit user confirmation.
- Use the fewest small, verifiable todos. Their content and the numbered steps
  must match exactly in count, order, and wording.
- Use only supplied or inspected context. Do not add Skill-specific formats,
  estimates, file lists, or checkpoints.
- Do not duplicate provider metadata in the plan; resolve it at runtime.
- Add `## Open Questions` only for unresolved non-material decisions. A
  material question blocks approval.
- Only `/work` appends corrective todos after approval. Initial todos omit
  `source`.
