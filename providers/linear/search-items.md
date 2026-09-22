# search-items

```text
tool: list_issues
arguments:
  query: caller query
  includeArchived: false
  orderBy: updatedAt
  limit: 5
```

Filter the provider results to title matches, return at most five with their
issue ID or identifier, title, state, team, project, and URL, and do not
paginate unless the user refines the search.
