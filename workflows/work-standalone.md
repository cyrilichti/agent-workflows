# Work Standalone

## Input

| Input | Description |
| --- | --- |
| `item` | Required item ID, native URL, title, or search phrase. |

## Steps

### 1. Prepare the Context

Run from this file's directory. For an ID or native URL:

```sh
node ../commands/prepare-delivery-context.ts "<item>"
```

For a title or search phrase:

```sh
node ../commands/prepare-delivery-context.ts --query "<item>"
```

On failure, report `stage` and `reason`, then stop.

### 2. Execute the Plan

On success, follow `./work-execute.md` with:

```text
plan: result.delivery_context.plan
item: result.delivery_context.item
delivery_context: result.delivery_context
work_mode: result.work_mode
```
