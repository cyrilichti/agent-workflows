# list-destinations

Require the caller `query` (list name or path phrase). Resolve with:

```text
tool: clickup_get_list
arguments:
  list_name: caller query
```

Only Lists are valid creation destinations. Return each match with a readable
`Space / Folder / List` path when available and its List ID.

Do not call `clickup_get_workspace_hierarchy` to present the full workspace.
If none or several lists match the query, return that outcome for the caller
to refine or select.
