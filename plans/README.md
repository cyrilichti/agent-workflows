# Plans

This directory stores plan files produced by `.agents/workflows/plan.md`.

Each file uses YAML frontmatter (`name`, `overview`, `todos`, `isProject`) and a
markdown body. The file extension depends on the AI tool that creates the plan
(for example `.plan.md` in Cursor Plan mode, `.md` otherwise).

## Naming

Base name:

```text
{YYYY-MM-DD}-{slug}
{YYYY-MM-DD}-{provider-id}-{slug}   # when a backlog item ID is available
```

See `.agents/templates/work-plan.md` for full naming and extension rules.

## Lifecycle

- Created during the plan workflow, before implementation starts.
- Updated when the developer requests plan adjustments.
- Todo statuses evolve during implementation (`pending` → `in-progress` →
  `completed`).

Generated plan files are gitignored. This directory README is tracked.
