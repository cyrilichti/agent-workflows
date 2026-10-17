# Select Next Item: Linear

Fetch the first 250 active issues carrying the exact `agent-planned` label
across the workspace. Keep the provider's first-page order:

```sh
linear api <<'GRAPHQL'
query PlannedIssues {
  issues(filter: {labels: {name: {eq: "agent-planned"}}},
         includeArchived: false, first: 250) {
    nodes {
      id identifier title url updatedAt
      state { name type }
      project { name }
      labels(first: 10) {
        nodes { name }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
GRAPHQL
```

If any candidate has `labels.pageInfo.hasNextPage: true`, retrieve its complete
labels with the paginated label query in `read-item.md` before normalizing that
candidate. Do not classify a partial label collection as complete.

Use the returned status name. Trim surrounding whitespace and match `Backlog`
or `Todo` case-insensitively as waiting to start. For any other name, interpret
its meaning: map it to waiting when it clearly means open or waiting to start,
including localized names. Do not use a fixed list of synonyms. Map a status
to review when its name clearly identifies review. Skip work in progress,
triage, completed, canceled, duplicate, missing, and ambiguous statuses.

Return the first page as normalized candidates, preserving provider order:

- `name`, `id`, `url`, `list`: title, issue ID, URL, and project name;
- `status_category`: `waiting`, `review`, or `other` from the mapping above;
- `labels`: the complete array of exact label names;
- `updated_at`: `updatedAt` converted from ISO-8601 with an explicit UTC
  offset to epoch milliseconds.

Represent absent or malformed label collections and timestamps as `null`.
Preserve a missing destination as `null`. Return the provider failure when the
selection call or a required label page fails.
