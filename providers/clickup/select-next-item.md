# Select Next Item: ClickUp

```text
tool: clickup_filter_tasks
arguments:
  tags: [agent-planned]
  include_closed: false
```

Use the returned status name. Trim surrounding whitespace and match `Open`
case-insensitively as waiting to start. For any other name, interpret its meaning:
map it to waiting when it clearly means open or waiting to start, including
localized names such as `ouvert`. Do not use a fixed list of synonyms.
Map a status to review when its name clearly identifies review.
`In Progress`, done, closed, canceled, missing, and ambiguous statuses are
skipped. `include_closed: false` is a query filter, not an eligibility check.

Return the first page as normalized candidates, preserving provider order:

- `name`, `id`, `url`, `list`: task name, task ID, URL, and list name;
- `status_category`: `waiting`, `review`, or `other` from the mapping above;
- `labels`: the complete `tags` array's exact `name` values;
- `updated_at`: `date_updated` converted from a Unix millisecond timestamp
  string to a finite nonnegative integer.

Represent absent or malformed label collections and timestamps as `null`.
Preserve a missing destination as `null`. Return the provider failure when the
selection call fails.
