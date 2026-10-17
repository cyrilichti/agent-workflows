# Select Next Item: ClickUp

```text
clickup-cli task search --tag agent-planned --page 0 --output json
```

Use the returned status name. Trim surrounding whitespace and match `Open`
case-insensitively as waiting to start. For any other name, interpret its meaning:
map it to waiting when it clearly means open or waiting to start, including
localized names such as `ouvert`. Do not use a fixed list of synonyms.
Map a status to review when its name clearly identifies review.
`In Progress`, done, closed, canceled, missing, and ambiguous statuses are
skipped. Omitting `--include-closed` is a query filter, not an eligibility check.

Return the first page as normalized candidates, preserving provider order:

- `name`, `id`, `url`, `list`: task name, task ID, URL, and list name;
- `status_category`: `waiting`, `review`, or `other` from the mapping above;
- `labels`: the complete `tags` array's exact `name` values;
- `updated_at`: `date_updated` converted from a Unix millisecond timestamp
  string to a finite nonnegative integer.

Represent absent or malformed label collections and timestamps as `null`;
do not coerce null, booleans, or empty strings to zero.
Preserve a missing destination as `null`. Return the provider failure when the
selection call fails.

Use native JSON, not `json-compact`, to preserve tags and millisecond dates.
Do not add scope, pagination, or a result limit. Return only normalized fields.
