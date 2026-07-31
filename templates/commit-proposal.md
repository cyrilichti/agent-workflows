# Commit Proposal

Use to present one proposed commit for the active todo.

## Format

```markdown
## Proposed Commit

Title: <commit title>

Description:

<commit description>
```

## Rules

- Propose one title and one description for the active todo.
- Format the title as a Conventional Commit:
  `<type>(<optional-scope>): <description>`.
- Use one of these lowercase types: `feat`, `fix`, `docs`, `style`, `refactor`,
  `perf`, `test`, `build`, `ci`, `chore`, or `revert`.
- Omit the parentheses when no concise and meaningful scope is available.
- Add `!` before `:` only for a breaking change.
- Write a concise, imperative title description without a trailing period.
- Use the commit description to explain the change and its reason without
  repeating the title.
- Do not include plan or todo trailers.
- Do not repeat the staged diff or changed-file list.
