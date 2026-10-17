# Transition Item Status

## Read

Reuse the caller's official item from the current workflow run when it includes
the current status and team. Otherwise read the issue:

```sh
linear api --variable "id=<caller item ID or identifier>" <<'GRAPHQL'
query CurrentStatus($id: String!) {
  issue(id: $id) {
    id
    identifier
    state { id name type }
    team { id key name }
  }
}
GRAPHQL
```

List that issue's team statuses:

```text
linear team states <reused or returned issue team key or ID> --limit all --json --no-input
```

Return the current and available statuses as `id`, `name`, and `category`:

- `completed`: Linear type `completed`, or a clear done or completed name;
- `review`: name clearly identifies review;
- `active`: Linear type `started`, excluding review;
- `other`: every remaining status.

Return the provider failure when a required read or normalization fails.

When the shared command supplies complete normalized `status_resolution`, the
read operation is omitted.

## Apply

```text
linear issue update <caller item ID or identifier> --state <exact resolved status ID or name> --no-input
```

Return the resulting status or provider failure. Do not pass any other field.
