# read-item

Read only the core fields needed by the caller:

```sh
linear api --variable "id=<item ID or identifier>" <<'GRAPHQL'
query ReadItem($id: String!) {
  issue(id: $id) {
    id identifier title description url
    state { id name type }
    team { id key name }
    project { id name url }
  }
}
GRAPHQL
```

Return the title, full description, state, native state type, team, project,
and URL. Normalize `closed` from `state.type`: `true` for `completed` or
`canceled`, `false` for other native types, and `null` when absent. A null
issue is not found.

When `labels` are requested, fetch every page of the issue's labels:

```sh
linear api --variable "id=<item ID or identifier>" --paginate <<'GRAPHQL'
query ItemLabels($id: String!, $after: String) {
  issue(id: $id) {
    labels(first: 50, after: $after) {
      nodes { id name }
      pageInfo { hasNextPage endCursor }
    }
  }
}
GRAPHQL
```

`--paginate` prints the complete label node array. Return every exact label
name. When attachments are requested, run:

```sh
linear api --variable "id=<item ID or identifier>" --paginate <<'GRAPHQL'
query ItemAttachments($id: String!, $after: String) {
  issue(id: $id) {
    attachments(first: 50, after: $after) {
      nodes { id title url subtitle sourceType }
      pageInfo { hasNextPage endCursor }
    }
  }
}
GRAPHQL
```

Require all pages; an incomplete or failed result is an error.

For linked resources, fetch both directions separately:

```sh
linear api --variable "id=<item ID or identifier>" --paginate <<'GRAPHQL'
query ItemRelations($id: String!, $after: String) {
  issue(id: $id) {
    relations(first: 50, after: $after) {
      nodes { id type relatedIssue { id identifier title url } }
      pageInfo { hasNextPage endCursor }
    }
  }
}
GRAPHQL
```

```sh
linear api --variable "id=<item ID or identifier>" --paginate <<'GRAPHQL'
query ItemInverseRelations($id: String!, $after: String) {
  issue(id: $id) {
    inverseRelations(first: 50, after: $after) {
      nodes { id type issue { id identifier title url } }
      pageInfo { hasNextPage endCursor }
    }
  }
}
GRAPHQL
```

A single `--paginate` invocation traverses only one connection. Do not treat
a first page as the complete relation set.

For `comments` or `request_backlinks`:

```text
linear issue comment list <item ID or identifier> --limit all --json --no-input
```

The CLI fetches every comment page and preserves full JSON bodies. Return the
requested comments and `Draft PR:` or `Draft MR:` URLs only. Stop when the
result is incomplete.
