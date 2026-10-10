# Select Next Item: ClickUp

```text
tool: clickup_filter_tasks
arguments:
  tags: [agent-planned]
  include_closed: false
```

Apply the eligibility contract in `../../commands/select-next-item.md` using
the returned status name. Trim surrounding whitespace and compare
case-insensitively against these waiting-to-start names: `Open`, `To Do`,
`Todo`, `Backlog`, `Not Started`, and `Awaiting Start`. Match whole names;
other or missing names do not establish eligibility. In particular,
`In Progress`, review, done, closed, canceled, and ambiguous custom statuses
are skipped. `include_closed: false` is a query filter, not a waiting-state
check.

From the first returned page, select the first qualifying task in provider
order. Return its `id`, `name`, `url`, and list name as `list`. Return no match
when that page has no qualifying task, even when later pages exist. A missing
list name on the selected task is an error.
