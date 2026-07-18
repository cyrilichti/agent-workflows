# Linear Provider

## retrieve-items

Retrieve Linear issues assigned to a person.

### Current Developer

1. Retrieve issues assigned to the current developer:

   ```text
   tool: list_issues
   arguments:
     assignee: me
     includeArchived: false
     orderBy: updatedAt
     limit: 50
   ```

2. Apply the caller criteria to the returned issues when Linear cannot express
   them directly.

Use Linear state names and state types as workspace-specific values. Do not
assume every workspace uses the same status labels.

## update-item-status

Update a Linear issue status.

1. Resolve the normalized target status to the workspace-specific Linear state.
   Prefer an active-work state such as `in progress` or its configured
   equivalent.
2. Use the available Linear MCP operation for updating an issue's state.
3. Pass the selected item ID and resolved state.

Ask the developer only when multiple active-work states could match.
