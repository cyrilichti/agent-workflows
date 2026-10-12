# Plan

Use for an implementation plan with visible todo states.

## File

Write to:

```text
../plans/{YYYY-MM-DD}-{objective-slug}.plan.md
```

Use a lowercase kebab-case slug of at most 40 characters. Append `-2`, `-3`,
etc. when the filename exists.

## Format

```markdown
# <Plan title>

<when an official item reference is supplied: **Ticket :** [<exact item ID>](<exact item URL>)>

## Overview

<one-line objective and approach>

## Objective

<what must be achieved>

## Problem

<what must be solved and why it matters>

## Expected Outcome

<how success will be recognized>

## Steps

1. ○ <one-sentence actionable step>

## Validation

- [ ] <how the work will be checked>
```

## Todo State

The numbered `## Steps` list is the sole authority for todo content, order, and
state. Use exactly one of these symbols between the number and content:

| State | Symbol |
| --- | --- |
| `pending` | `○` |
| `in_progress` | `◐` |
| `completed` | `✓` |
| `cancelled` | `⊘` |

Change only the step symbol for a state transition. Do not add a state label or
checkbox to a step, and do not infer todo state from checkboxes in
`## Validation` or other sections. At most one todo may be
`in_progress`; cancellation requires explicit user confirmation. Start every
initial todo as `pending`.

## Rules

- Treat the project-relative `.plan.md` file path as the canonical plan
  reference. The H1 heading is the plan name.
- Use the fewest small, verifiable todos. Preserve their content and order when
  changing state.
- Use only supplied or inspected context. Do not add Skill-specific formats,
  estimates, file lists, or checkpoints.
- For official item context, render its exact supplied ID and URL in the ticket
  reference without reconstructing either value. Omit it for standalone plans.
- Do not add other provider, item, Git, or request metadata to the plan.
- Add `## Open Questions` only for unresolved decisions.
- Only `/work` appends corrective todos after approval. Use
  `../templates/corrective-todo.md` for their provenance.
