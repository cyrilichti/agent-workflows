# Plans

This directory stores generated plan files produced by
`../workflows/plan.md`.

Each file uses YAML frontmatter (`name`, `overview`, `todos`, `isProject`) and
a markdown body. Its project-relative `.plan.md` path is its canonical
reference.

```text
{YYYY-MM-DD}-{slug}.plan.md
{YYYY-MM-DD}-{provider-id}-{slug}.plan.md # when an item ID is available
```

See `../templates/plan.md` for the complete format, naming rules, statuses, and
lifecycle. Generated plans are gitignored; this README is tracked.
