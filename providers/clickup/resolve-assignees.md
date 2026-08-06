# resolve-assignees

For `me` or an exact name or email:

```text
tool: clickup_resolve_assignees
arguments:
  assignees:
    - caller query
```

When a readable member record or disambiguation is needed, use
`clickup_find_member_by_name`. If the name is ambiguous, use
`clickup_get_workspace_members` and post-filter by the query rather than asking
the user for a numeric ID.
