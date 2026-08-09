# Done Standalone Branch

## Steps

### 1. Resolve the Official Item

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Preserve any exact item ID or title phrase available with the invocation as the
item hint. Run `../commands/select-review-item.md` with:

```text
provider: resolved item provider
reference: supplied exact provider item ID, when available
query: supplied title phrase, when no exact ID is available
```

Run `../commands/read-item.md` with:

```text
provider: resolved item provider
item_id: selected provider item ID
fields: request_backlinks
```

Keep the returned item and provider ID as the complete official item context.

### 2. Resolve the Exact Request

Run `../commands/resolve-version-provider.md`. Read the current Git push remote
without fetching, then run `../commands/resolve-version-repository.md` with:

```text
provider: resolved version provider
push_remote: current push remote
```

Run `../commands/resolve-request.md` with:

```text
provider: resolved version provider
repository: resolved repository
request_backlinks: official item request backlinks
require_non_draft: true
allowed_states:
  - open
  - merged
fields: delivery_state
```

When no unique backlink resolves the request, let the command ask for the exact
pull-request number or merge-request IID. Never list, search for, or substitute
another request.

Keep the returned complete request record as the exact request context.

### 3. Follow Shared Completion

Project the resolved records through `../templates/done-context.md`, then
follow `./done-confirm.md` with:

```text
completion_context: compact projected Done Context
```
