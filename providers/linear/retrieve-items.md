# Retrieve Items

Retrieve Linear issues matching the caller's criteria. Retain only requested
display fields from the resulting records. Do not print full issue payloads to
the caller.

## Current User

```text
linear issue query --all-teams --assignee @me --limit 5 --json --no-input
```

Apply any caller criteria that Linear cannot express directly. Return the
first `limit` matches without requesting more issues. Normalize native `id` as
`provider_id`, `state.name` as `status`, and `state.type` as `statusType`.

## Status Criteria

```text
linear issue query --team <resolved team ID> --state <resolved state ID> --limit <caller limit> --json --no-input
```

Do not pass `--assignee` unless requested. Return only team and project when
the caller requests destination information. Use native state names and types;
do not assume every workspace uses the same labels.

## Labeled Candidate Criteria

Use an exact, case-sensitive label name filter. The native `--label` resolver
matches case-insensitively, so use a focused GraphQL query here:

```sh
linear api --variable "label=<exact label name>" --variable "limit=<caller limit>" <<'GRAPHQL'
query LabeledIssues($label: String!, $limit: Int!) {
  issues(filter: {labels: {name: {eq: $label}}},
         includeArchived: false, first: $limit) {
    nodes {
      id identifier title
      state { name type }
      team { id name }
      project { id name }
    }
  }
}
GRAPHQL
```

Do not filter by state or assignee unless the caller requests it. A label
resolver ambiguity or provider failure is an error, not an empty result.

## Open Labeled Candidate Criteria

Use the same labeled query with the caller's limit. Exclude native state types
`completed`, `canceled`, and `duplicate` from the returned issues. Do not pass
`--assignee` or request more pages to backfill exclusions.
