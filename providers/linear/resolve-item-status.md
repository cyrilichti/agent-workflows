# resolve-item-status

Use `list_teams`, then `list_issue_statuses` for each team, and return every
matching `team` and `state` pair for `semantic_status`. If teams or states
cannot be listed, report resolution as unavailable. Do not retrieve issues.
