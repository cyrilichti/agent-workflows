# Linear Provider

## retrieve-work-items

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
