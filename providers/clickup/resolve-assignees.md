# resolve-assignees

Require the caller `query` (`me`, name, or email).

For `me` or an email, resolve with:

```text
tool: clickup_resolve_assignees
arguments:
  assignees:
    - caller query
```

For a name, retrieve one candidate with:

```text
tool: clickup_find_member_by_name
arguments:
  name_or_email: caller query
```

Return a name result as an unconfirmed candidate with readable name, email,
internal ID, and `confirmation_required: true`. The tool does not expose all
name matches, so never infer uniqueness or select the candidate implicitly.
The caller must confirm it or refine the expression, preferably to an email.

Do not call `clickup_get_workspace_members`.
