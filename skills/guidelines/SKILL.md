---
name: guidelines
description: Record durable project conventions from user feedback, find applicable conventions before work, or reorganize the catalog on request.
---

# Guidelines

Use the consuming project's repository root, including when these instructions
are installed under `.agents/` or the project is checked out in a worktree.
Keep the catalog in the project's `guidelines/` directory so it can be shared
across sessions and preserved by workflow updates.

## Catalog

`guidelines/index.md` is the entry point. Each entry is a relative Markdown
link to a topic file followed by a brief condition that describes when to read
it. For example:

```markdown
- [HTTP controllers](http-controllers.md) — Adding or changing an HTTP endpoint or controller.
```

## Find

Use the todo or planning decision and its known component or paths to match
the conditions in the index. Open only the matching topic files and use their
applicable conventions as context for the current work. If the index is absent
or nothing applies, continue with the existing project context. This mode is
read-only.

## Other Modes

- For a durable convention, read and follow [Record](references/record.md).
- On a request to reorganize the catalog, read and follow [Curate](references/curate.md).
