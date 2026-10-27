# Work Standalone Branch

## Input

| Input | Description |
| --- | --- |
| `reference` | Item ID or native URL, when supplied. |
| `query` | Item title or search phrase, when no reference is supplied. |

## Steps

### 1. Prepare the Context

Run from this file's directory, passing an empty string for an absent input:

```sh
node ../commands/work-standalone.ts "<reference>" "<query>"
```

The command requires a reference or a unique title match. On failure, report
`stage` and `reason`, then stop without asking a question or retrying.

### 2. Execute the Plan

On success, follow `./work-item.md` with:

```text
plan: result.delivery_context.plan
item: result.delivery_context.item
delivery_context: result.delivery_context
work_mode: result.work_mode
```
