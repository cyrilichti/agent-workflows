# Plans

This directory stores plan files produced by `../workflows/plan.md`.

Each file uses YAML frontmatter (`name`, `overview`, `todos`, `isProject`) and a
markdown body. Generated plan files must use the `.plan.md` extension.

## Naming

Base name:

```text
{YYYY-MM-DD}-{slug}
{YYYY-MM-DD}-{provider-id}-{slug}   # when an item ID is available
```

See `../templates/plan.md` for full naming rules.

## Lifecycle

- Created during the plan workflow, before implementation starts.
- Updated when the user requests plan adjustments.
- Todo statuses evolve during implementation (`pending` → `in-progress` →
  `completed` or `error`).

Generated plan files are gitignored. This directory README is tracked.
