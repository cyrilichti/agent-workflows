# list-destinations

First list available teams:

```text
tool: list_teams
arguments:
  includeArchived: false
```

A team is required to create an issue. After the team is selected, list its
projects when the user wants to attach the issue to a project:

```text
tool: list_projects
arguments:
  team: selected team ID
  includeArchived: false
```

Return a composite destination containing the required team and optional
project. Keep their IDs internal.
