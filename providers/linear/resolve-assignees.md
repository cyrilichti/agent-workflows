# resolve-assignees

Require the caller `query`. For `me`, preserve the literal value because Linear
accepts it directly.

For a name or email:

```text
tool: list_users
arguments:
  query: caller query
  limit: 20
```

Return matching user names and IDs. Do not list users without a query.
