# resolve-assignees

Require the caller `query` (`me`, name, or email). Resolve with:

```text
tool: clickup_resolve_assignees
arguments:
  assignees:
    - caller query
```

When a readable member record is needed, use `clickup_find_member_by_name`
with the same query. Do not call `clickup_get_workspace_members`.

Return matching people with readable names and IDs. If none or several match,
return that outcome for the caller to refine or select.
