# list-destinations

List complete active team and project candidates with the CLI:

```text
linear team list --limit all --json --no-input
linear project list --all-teams --limit all --json --no-input
```

`project list` follows every project page and includes project IDs, names,
URLs, and associated teams. Exclude archived teams and projects whose native
status is completed or canceled. Keep all associated teams; a project shared
by several teams is not a single creatable destination.

For each matching project candidate, verify its complete associated team set
before returning it. The project list's nested `teams` field may itself have
more pages:

```sh
linear api --variable "id=<matching project ID>" --paginate <<'GRAPHQL'
query ProjectTeams($id: String!, $after: String) {
  project(id: $id) {
    teams(first: 50, after: $after) {
      nodes { id key name }
      pageInfo { hasNextPage endCursor }
    }
  }
}
GRAPHQL
```

For a native Linear project URL, extract its project slug. Resolve that slug
or an explicit project ID directly, then verify the returned URL or ID:

```text
linear project view <project slug or ID> --json --no-input
```

For a native team URL or explicit team key/ID, parse its team key or ID, then
match it against the complete team list. Verify the returned native identity
before marking it `native_url` or `exact_id`.

For a name, compare all active team and project names using the command's
normalization before marking a candidate `normalized_exact_name` or
`strong_unique_approximate`.

A Linear destination contains a required team and an optional project. A team
match returns a team-only destination. A project match returns the project and
its team when it belongs to exactly one team. Return one candidate per team
when the project belongs to several teams so the caller can ask which team to
use.

Return each creatable candidate with:

```text
label: readable team or Team / Project label
value:
  team: team ID
  project: project ID when present
match: native_url | exact_id | normalized_exact_name |
  strong_unique_approximate | possible
```
