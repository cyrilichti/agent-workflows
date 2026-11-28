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

Keep new topic files flat initially. Each file states the convention and its
scope, and can point to a project example when that clarifies the convention.
Retain a concise source reference when available.

## Find

Use the todo or planning decision and its known component or paths to match
the conditions in the index. Open only the matching topic files and use their
applicable conventions as context for the current work. If the index is absent
or nothing applies, continue with the existing project context. This mode is
read-only.

## Record

Use the user's explicit or confirmed enduring convention and the affected
project scope. A request confined to one ticket stays with that ticket. If
durability or scope is unclear, ask before recording.

Consult the index and read any existing entries covering the same subject.
Update the owning topic and its condition when possible. Otherwise create the
index if needed and add one topic file and its entry. Surface a contradiction
unless the user explicitly supersedes the earlier convention. Verify that the
entry resolves and describes when the updated rule applies.

## Curate

On request, read the index and the topics in scope. Merge equivalent entries,
split topics that cover distinct decisions, and group files under a thematic
subdirectory when that improves navigation. Update the index and affected
relative links together and preserve each rule's scope and source through
moves. Check that index links resolve and their conditions still find the
appropriate topics.

When two conventions conflict, preserve both positions and present their
scope and sources for a user decision. Continue with independent catalog
changes when possible.
