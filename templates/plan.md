# Plan

Use this template when creating a plan before implementation.

The output is a `.plan.md` markdown file with YAML frontmatter and a structured
body so metadata and todos can integrate with compatible Plan UIs.

---

## File Location

Write the plan to:

```text
../plans/<basename>.plan.md
```

See **Naming** below for `<basename>`.

---

## Naming

Base name pattern:

```text
{YYYY-MM-DD}-{slug}
```

Rules:

- `{YYYY-MM-DD}` — plan creation date (ISO 8601).
- `{slug}` — kebab-case summary of the objective (lowercase, `[a-z0-9-]`, max 40
  characters).
- When an item provider ID is available, insert it before the slug:
  `{YYYY-MM-DD}-{provider-id}-{slug}`
- If the target file already exists, append a numeric suffix: `-2`, `-3`, etc.

Examples:

```text
2026-07-14-auth-refactor.plan.md
2026-07-14-cu-abc123-auth-refactor.plan.md
2026-07-14-auth-refactor-2.plan.md
```

## Format

```markdown
---
name: <short plan title>
overview: <one-line summary of objective and approach>
todos:
  - id: <step-slug>
    content: <actionable step description>
    status: pending
  - id: <step-slug>
    content: <actionable step description>
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

1. <step 1 — same text as first todo `content`>
2. <step 2 — same text as second todo `content`>
3. <step 3 — same text as third todo `content`>

## Validation

- [ ] <how the work will be checked>
```

---

## Frontmatter Rules

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes | Short title shown in Plan UI |
| `overview` | yes | One-line scope summary |
| `todos` | yes | One item per step; count must match `## Steps` |
| `todos[].id` | yes | Unique kebab-case slug within the plan |
| `todos[].content` | yes | Actionable, implementation-ready description |
| `todos[].status` | yes | Use `pending` for new plans |
| `isProject` | yes | `false` single-task; `true` multi-stream |

---

## Body Rules

- Keep the plan practical enough to guide implementation.
- **Todos and Steps must match exactly**: same count, same order, same wording
  (`todos[].content` = corresponding numbered item under `## Steps`). Do not add
  todos without a matching step, or steps without a matching todo.
- Use only the provided context and user answers.
- Do not include implementation details that require codebase analysis unless
  that analysis has already happened.
- Include an `## Open Questions` section only when unresolved questions remain.
  Omit the section instead of writing "None".
