# Work Standalone Branch

## Input

| Input | Description |
| --- | --- |
| `reference` | Optional item ID or native URL supplied by the user. |
| `query` | Optional item title or search phrase. |

## Steps

### 1. Select the Item

Use `reference` when supplied. Otherwise, load the following files together
and follow them in order:

```sh
cat ../commands/resolve-item-provider.md ../commands/resolve-existing-item.md
```

Pass to `resolve-existing-item`:

```text
provider: resolved item provider
query: supplied query, when available
candidate_criteria:
  status: open
  label: agent-planned
selection_only: true
```

Use the selected provider item ID as `reference`.

### 2. Prepare the Context

Run from this file's directory:

```sh
node ../commands/work-standalone.ts "<reference>"
```

On failure, report `stage` and `reason`, then stop. On success, follow
`./work-item.md` with:

```text
plan: result.delivery_context.plan
item: result.delivery_context.item
delivery_context: result.delivery_context
work_mode: result.work_mode
```
