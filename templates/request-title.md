# Request Title

Use when creating the draft merge request for a selected plan.

## Format

With an official item:

```text
Draft: <item-id>: <plan-name>
```

Without an official item:

```text
Draft: <plan-name>
```

## Rules

- Use the exact official item ID supplied by the caller.
- Use the plan frontmatter `name` as `<plan-name>`.
- Do not add a provider name, branch name, todo, or generated identifier.
- This template defines only the title. It does not require a merge-request
  description.
