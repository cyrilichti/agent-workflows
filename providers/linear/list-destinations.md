# list-destinations

Require the caller `query` as a team or project URL, identifier, or name.

For a native Linear project URL, extract its project slug and resolve it with:

```text
tool: get_project
arguments:
  query: extracted project slug
```

For a native Linear team URL, extract its team key and resolve it with:

```text
tool: get_team
arguments:
  query: extracted team key
```

Resolve an explicit project identifier or ID with `get_project`, and an
explicit team key or ID with `get_team`. Verify that the returned resource
matches the supplied URL or identifier before marking it `native_url` or
`exact_id`.

For a name, search active teams and projects with:

```text
tool: list_teams
arguments:
  query: caller query
  includeArchived: false

tool: list_projects
arguments:
  query: caller query
  includeArchived: false
  fields: [name, url, teams]
```

Compare returned names using the command's normalization. Mark normalized exact
matches accordingly. When search results do not establish an exact match, page
through active teams and projects and compare all names before marking one
candidate `strong_unique_approximate`.

A Linear destination contains a required team and an optional project. A team
match returns a team-only destination. A project match returns the project and
its team when it belongs to exactly one team. Return one candidate per team when
the project belongs to several teams so the caller can ask which team to use.

Return each creatable candidate with:

```text
label: readable team or Team / Project label
value:
  team: team ID
  project: project ID when present
match: native_url | exact_id | normalized_exact_name |
  strong_unique_approximate | possible
```
