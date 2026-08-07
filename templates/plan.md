# Plan

Use for a Plan UI-compatible implementation plan.

## File

Write to:

```text
../plans/{YYYY-MM-DD}-{objective-slug}.plan.md
```

Use a lowercase kebab-case slug of at most 40 characters. Append `-2`, `-3`,
etc. when the filename exists.

## Format

```markdown
---
planId: "<stable plan identity>"
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
| `planId` | yes | Stable plan identity |
| `name` | yes | Short title shown in Plan UI |
| `overview` | yes | One-line scope summary |
| `todos` | yes | One item per numbered step |
| `todos[].id` | yes | Unique kebab-case slug within the plan |
| `todos[].content` | yes | Exact corresponding step text |
| `todos[].status` | yes | `pending`, `in_progress`, `completed`, or `cancelled` |
| `isProject` | yes | `false` for one delivery unit |

## Rules

- Use the exact provider item ID as `planId` when available; otherwise use one
  generated `plan:<uuid-v4>`. Never change it.
- Start every todo as `pending`. Later allow only `pending`, `in_progress`,
  `completed`, or `cancelled`, with at most one `in_progress`; cancellation
  requires explicit user confirmation.
- Use the fewest small, verifiable todos. Their content and the numbered steps
  must match exactly in count, order, and wording.
- Use only supplied or inspected context. Do not add Skill-specific formats,
  estimates, file lists, or checkpoints.
- Do not duplicate provider metadata in the plan; resolve it at runtime.
- Add `## Open Questions` only for unresolved decisions.
