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

## search-items

```text
tool: list_issues
arguments:
  query: caller query
  includeArchived: false
  orderBy: updatedAt
  limit: 20
```

Prefer title matches. Return issue ID or identifier, title, state, team,
project,
and URL. Do not paginate unless the developer refines the search.

## read-item

```text
tool: get_issue
arguments:
  id: item ID or identifier
```

Return the issue's title, description, state, team, project, assignee, and URL.

Set `includeRelations: true` when linked resources are requested. When comments
are requested, call `list_comments` with `issueId` set to the same issue ID or
identifier. Attachments are returned by `get_issue`.

## list-destinations

First list available teams:

```text
tool: list_teams
arguments:
  includeArchived: false
```

A team is required to create an issue. After the team is selected, list its
projects when the developer wants to attach the issue to a project:

```text
tool: list_projects
arguments:
  team: selected team ID
  includeArchived: false
```

Return a composite destination containing the required team and optional
project. Keep their IDs internal.

## resolve-assignees

For `me`, preserve the literal value because Linear accepts it directly.

For a name or email:

```text
tool: list_users
arguments:
  query: caller query
  limit: 20
```

Return matching user names and IDs.

## create-item

Serialize the confirmed item sections as Markdown, then create the issue:

```text
tool: save_issue
arguments:
  team: selected destination team
  project: selected destination project, when provided
  title: confirmed title
  description: confirmed structured content
```

Omit assignment and state so the caller can handle them separately.

## update-item

```text
tool: save_issue
arguments:
  id: item ID or identifier
  title: confirmed title, when changed
  description: confirmed structured content, when changed
```

Omit every field that the developer did not confirm changing.

## assign-item

```text
tool: save_issue
arguments:
  id: item ID or identifier
  assignee: selected user ID or me
```

Do not include other update fields.

## update-item-status

Update a Linear issue status.

1. Resolve the normalized target status to the workspace-specific Linear state.
   Prefer an active-work state such as `in progress` or its configured
   equivalent.
2. Use the available Linear MCP operation for updating an issue's state.
3. Pass the selected item ID and resolved state.

Ask the developer only when multiple active-work states could match.
