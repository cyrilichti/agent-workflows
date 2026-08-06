# list-destinations

Require the caller `query` (team name). Search teams with:

```text
tool: list_teams
arguments:
  query: caller query
  includeArchived: false
```

A team is required to create an issue. After one team is selected, list its
projects only when the user wants to attach a project:

```text
tool: list_projects
arguments:
  team: selected team ID
  includeArchived: false
```

Return a composite destination with the required team and optional project.
Keep IDs internal. Do not list every team without a query.
