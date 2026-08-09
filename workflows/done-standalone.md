# Done Standalone Branch

## Steps

### 1. Resolve the Official Item

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Run `../commands/select-review-item.md` with:

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

Keep the complete official item.

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

Keep the exact returned request.

### 3. Follow Shared Completion

Project the resolved records through `../templates/done-context.md`, then
follow `./done-confirm.md` with:

```text
completion_context: compact projected Done Context
entry_mode: standalone
```
