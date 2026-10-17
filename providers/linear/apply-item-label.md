# apply-item-label

Find an active, non-group workspace label with the exact supplied name:

```sh
linear api --variable "name=<supplied label>" --paginate <<'GRAPHQL'
query FindLabel($name: String!, $after: String) {
  issueLabels(filter: {name: {eq: $name}, isGroup: {eq: false}, team: {null: true}},
              first: 250, after: $after, includeArchived: false) {
    nodes { id name }
    pageInfo { hasNextPage endCursor }
  }
}
GRAPHQL
```

`--paginate` returns the complete array of matching label nodes. Compare
native names exactly. When no exact match exists, create a workspace label:

```sh
linear api --variable "name=<supplied label>" <<'GRAPHQL'
mutation CreateLabel($name: String!) {
  issueLabelCreate(input: {name: $name}) {
    success
    issueLabel { id name }
  }
}
GRAPHQL
```

Require `success: true` and use the returned label ID. The mutation omits
`teamId`, so the new label belongs to the workspace.

Apply the resolved or created label without replacing existing labels:

```text
linear issue update <item ID or identifier> --add-label <resolved label ID> --no-input
```

Return `applied: true` only after a successful issue update. Return
`applied: false` with `reason: provider_failure` on lookup, creation, or
application failure.
