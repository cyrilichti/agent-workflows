# apply-item-label

Read the item's team and find active, non-group labels with the exact supplied
name across the workspace and teams:

```sh
linear api --variables-json '{"name":"<supplied label>","itemId":"<item ID>"}' <<'GRAPHQL'
query FindLabel($name: String!, $itemId: String!, $after: String) {
  issue(id: $itemId) { team { id } }
  issueLabels(filter: {name: {eq: $name}, isGroup: {eq: false}},
              first: 250, after: $after, includeArchived: false) {
    nodes { id name team { id } }
    pageInfo { hasNextPage endCursor }
  }
}
GRAPHQL
```

Follow every page using `after`. Keep labels belonging to the item's team or
the workspace, and compare native names exactly. Stop on multiple applicable
matches. When no applicable label exists, create a workspace label:

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

Require `success: true`. The mutation omits
`teamId`, so the new label belongs to the workspace.

Apply the resolved or created label without replacing existing labels:

```text
linear issue update <item ID or identifier> --add-label <supplied label name> --no-input
```

Return `applied: true` only after a successful issue update. Return
`applied: false` with `reason: provider_failure` on lookup, creation, or
application failure.
