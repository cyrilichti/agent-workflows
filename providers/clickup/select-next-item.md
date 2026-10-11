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
other or missing names do not establish eligibility. In particular,
`Review` and `In Review` map to review under the same whole-name comparison.
`In Progress`, done, closed, canceled, and ambiguous custom statuses are
skipped. `include_closed: false` is a query filter, not an eligibility check.

Use the complete `tags` array's exact `name` values and normalize `date_updated`
from a Unix millisecond timestamp string to a finite nonnegative integer.
Reject absent, null, or malformed required fields according to the shared
selection contract in `../../commands/select-next-item.md`.

Apply that contract to the first returned page. Return the selected task's
`id`, `name`, `url`, and list name as `list`. A missing list name on the selected
task is an error.
