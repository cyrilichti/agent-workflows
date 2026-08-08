# Plans

This directory stores generated plan files produced by
`../workflows/plan.md`.

Each file uses YAML frontmatter (`planId`, `name`, `overview`, `todos`,
`isProject`) and a markdown body. Generated plan files must use the `.plan.md`
extension.

```text
{YYYY-MM-DD}-{slug}
{YYYY-MM-DD}-{provider-id}-{slug} # when an item ID is available
```

See `../templates/plan.md` for the complete format, naming rules, statuses, and
lifecycle. Generated plans are gitignored; this README is tracked.
