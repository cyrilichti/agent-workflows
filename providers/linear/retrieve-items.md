# Retrieve Items

Retrieve Linear issues matching the caller's criteria.

## Current User

1. Retrieve issues assigned to the current user:

   ```text
   tool: list_issues
   arguments:
     assignee: me
     includeArchived: false
     fields:
       - id
       - title
       - status
       - statusType
     limit: 5
   ```

2. Apply the caller criteria to the returned issues when Linear cannot express
   them directly.

Return the first `limit` matches without following the cursor. Normalize `id`
as `provider_id` and the state name as `status`.

Use Linear state names and state types as workspace-specific values. Do not
assume every workspace uses the same status labels.

## Status Criteria

Use `list_issues` with the caller's resolved `team` and `state`. Do not pass
`assignee` unless the caller requested it. Never follow the returned cursor.

Use the same fields, plus `team` and `project` only for destination.
