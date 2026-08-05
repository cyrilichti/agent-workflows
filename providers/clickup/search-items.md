# search-items

Search tasks by user-provided title text:

```text
tool: clickup_search
arguments:
  keywords: caller query
  filters:
    asset_types:
      - task
  count: 20
```

Prefer results whose names match the query. Return task ID, name, status, URL,
and hierarchy. Do not paginate unless the user refines the search.
