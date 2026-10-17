# search-items

Search titles across the workspace, ordered by last update, with a targeted
GraphQL response:

```sh
linear api --variable "query=<caller title phrase>" <<'GRAPHQL'
query SearchItems($query: String!) {
  issues(filter: {title: {containsIgnoreCase: $query}},
         includeArchived: false, orderBy: updatedAt, first: 5) {
    nodes {
      id identifier title url
      state { name type }
      team { id name }
      project { id name }
    }
  }
}
GRAPHQL
```

Filter the returned titles against the caller phrase, return at most five with
their issue ID or identifier, title, state, team, project, and URL, and do not
paginate unless the user refines the search. Treat a failed query as a
provider failure.
