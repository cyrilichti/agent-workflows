# list-destinations

Require the caller `query` as an exact list name. Resolve with:

```text
tool: clickup_get_list
arguments:
  list_name: caller query
```

Only Lists are valid creation destinations. Return the result as an unconfirmed
candidate with a readable `Space / List` label, URL, internal List ID, and
`confirmation_required: true`.

Do not call `clickup_get_workspace_hierarchy` to present the full workspace.
`clickup_get_list` does not expose all matches, so never infer uniqueness or
select its result implicitly. The caller must confirm the candidate or refine
the expression.
