# Work Standalone

## Input

| Input | Description |
| --- | --- |
| `reference` | Required item ID or native URL. |

## Steps

### 1. Prepare the Context

Run from this file's directory:

```sh
node ../commands/work-standalone.ts "<reference>"
```

On failure, report `stage` and `reason`, then stop.

### 2. Execute the Plan

On success, follow `./work-item.md` with:

```text
plan: result.delivery_context.plan
item: result.delivery_context.item
delivery_context: result.delivery_context
work_mode: result.work_mode
```
