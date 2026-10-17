# resolve-item-status

```text
linear team list --limit all --json --no-input
linear team states <team key or ID> --limit all --json --no-input
```

Run `team states` for each returned team. Return every matching `team` and
`state` pair for `semantic_status`, retaining native state IDs, names, and
types. If teams or any team's states cannot be listed, report resolution as
unavailable. Do not retrieve issues.
