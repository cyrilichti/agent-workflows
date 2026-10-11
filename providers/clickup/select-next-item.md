# Select Next Item: ClickUp

```text
tool: clickup_filter_tasks
arguments:
  tags: [agent-planned]
  include_closed: false
```

Use the returned status name. Trim surrounding whitespace and compare
case-insensitively against these waiting-to-start names: `Open`, `To Do`,
`Todo`, `Backlog`, `Not Started`, and `Awaiting Start`. Match whole names;
other or missing names do not establish waiting eligibility. Map review names
using `../../rules/review-status.md`.
`In Progress`, done, closed, canceled, and ambiguous custom statuses are
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
