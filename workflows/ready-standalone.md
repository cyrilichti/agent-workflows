# Ready Standalone

## Input

| Input | Description |
| --- | --- |
| `item` | Required item ID, native URL, title, or search phrase. |

## Steps

### 1. Prepare the Context

Run from this file's directory. For an ID or native URL:

```sh
node ../commands/prepare-delivery-context.ts --require-linked-request "<item>"
```

For a title or search phrase:

```sh
node ../commands/prepare-delivery-context.ts --require-linked-request --query "<item>"
```

On failure, report `stage` and `reason`, then stop.

### 2. Promote the Request

On success, follow `./ready-execute.md` with:

```text
delivery_context: result.delivery_context
```
