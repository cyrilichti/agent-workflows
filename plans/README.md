# Plans

This directory stores plan files produced by `../workflows/plan.md`.

Each file uses YAML frontmatter (`planId`, `name`, `overview`, `todos`,
`isProject`) and a markdown body. Generated plan files must use the `.plan.md`
extension.

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
- A new plan starts with every todo set to `pending`.
- At most one todo may be `in_progress`.
- Todo statuses use `pending`, `in_progress`, `completed`, or `cancelled`.
- A plan is complete when every todo is `completed` or `cancelled`.
- `cancelled` requires explicit user confirmation.

Generated plan files are gitignored. This directory README is tracked.
