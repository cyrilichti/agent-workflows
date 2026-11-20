# Inspect Standalone

## Input

| Input | Description |
| --- | --- |
| `item` | Required item ID, native URL, title, or search phrase. |

## Steps

### 1. Prepare the Context

Run from this file's directory. For an item ID or native URL:

```sh
node ../commands/prepare-delivery-context.ts --require-linked-request "<item>"
```

For a title or search phrase:

```sh
node ../commands/prepare-delivery-context.ts --require-linked-request --query "<item>"
```

This is the same context preparation used by `/ready`. The inspection snapshot
verifies the branch and the published request head.

### 2. Inspect the Request

On success, follow `./inspect-execute.md` with the returned `delivery_context`.
