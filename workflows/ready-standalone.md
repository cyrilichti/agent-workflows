# Ready Standalone

## Input

| Input | Description |
| --- | --- |
| `item` | Required item ID, native URL, title, or search phrase. |

## Steps

### 1. Prepare the Context

Run from this file's directory. For an ID or native URL:

```sh
node ../commands/ready-standalone.ts "<item>"
```

For a title or search phrase:

```sh
node ../commands/ready-standalone.ts --query "<item>"
```

On failure, report `stage` and `reason`, then stop.

### 2. Promote the Request

On success, follow `./ready-item.md` with:

```text
delivery_context: result.delivery_context
```
