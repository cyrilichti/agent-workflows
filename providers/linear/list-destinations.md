# list-destinations

Require the caller `query` (team name). Search teams with:

```text
tool: list_teams
arguments:
  query: caller query
  includeArchived: false
```

A team is required to create an issue. After one team is selected, ask for a
project expression only when the user wants to attach a project, then search
with:

```text
tool: list_projects
arguments:
  team: selected team ID
  query: caller project query
  includeArchived: false
```

Return a composite destination with the required team and optional project.
