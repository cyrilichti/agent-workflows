# list-destinations

```text
tool: clickup_get_workspace_hierarchy
arguments:
  max_depth: "2"
```

Only Lists are valid creation destinations. Return each List with a readable
`Space / Folder / List` path and its List ID. Continue pagination only when
needed to resolve the user's requested destination.
