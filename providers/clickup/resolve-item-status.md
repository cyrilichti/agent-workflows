# resolve-item-status

Use `clickup_get_workspace_hierarchy` with `max_depth: "2"` and return every
status name that clearly matches `semantic_status`. If the hierarchy does not
expose statuses, report resolution as unavailable. Do not retrieve tasks.
