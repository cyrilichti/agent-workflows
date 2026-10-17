# read-item

Resolve the official issue ID, identifier, state type, and destination fields
missing from `linear issue view --json`:

```sh
linear api --variable "id=<item ID or identifier>" <<'GRAPHQL'
query ReadItemContext($id: String!) {
  issue(id: $id) {
    id identifier
    state { id name type }
    team { id key name }
    project { id name url }
  }
}
GRAPHQL
```

Stop if the issue is null or the query fails. The native view command requires
the returned identifier, not the issue's UUID:

```text
linear issue view <returned identifier> --json --no-comments --no-input
```

Omit `--no-comments` when `comments` or `request_backlinks` are requested. The
CLI fetches every page of labels, attachments, documents, and, when included,
comments. Return the full description and only the optional fields requested
by the caller. Use exact label names and complete comment bodies. Extract
`Draft PR:` or `Draft MR:` URLs from comments for `request_backlinks`.

For linked issue relations, also run:

```text
linear issue relation list <returned identifier> --no-input
```

This command fetches both relation directions and every page. Return their
types, directions, identifiers, and titles. Include attachments and documents
from the issue view when linked resources or attachments are requested.

Normalize `closed` from the queried `state.type`: `true` for `completed` or
`canceled`, `false` for other native types, and `null` when absent. Return the
queried team and project as the destination. Stop on any failed or incomplete
required read; do not return the raw CLI payload to the caller.
