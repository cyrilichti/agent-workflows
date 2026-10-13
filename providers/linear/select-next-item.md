# Select Next Item: Linear

```text
tool: list_issues
arguments:
  label: agent-planned
  includeArchived: false
  limit: 250
  fields: [id, title, url, project, status, labels, updatedAt]
```

Use the returned status name. Trim surrounding whitespace and match `Backlog`
or `Todo` case-insensitively as waiting to start. For any other name, interpret
its meaning: map it to waiting when it clearly means open or waiting to start,
including localized names. Do not use a fixed list of synonyms.
Map a status to review when its name clearly identifies review.
Skip work in progress, triage, completed, canceled, duplicate, missing, and
ambiguous statuses.

Return the first page as normalized candidates, preserving provider order:

- `name`, `id`, `url`, `list`: title, issue ID, URL, and project name;
- `status_category`: `waiting`, `review`, or `other` from the mapping above;
- `labels`: the complete array of exact label names;
- `updated_at`: `updatedAt` converted from ISO-8601 with an explicit UTC
  offset to epoch milliseconds.

Represent absent or malformed label collections and timestamps as `null`.
Preserve a missing destination as `null`. Return the provider failure when the
selection call fails.
