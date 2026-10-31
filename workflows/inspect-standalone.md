# Inspect Standalone Branch

## Steps

### 1. Prepare the Delivery Context

Run from this file's directory. For an item ID or native URL:

```sh
node ../commands/prepare-delivery-context.ts --require-linked-request "<item>"
```

For a title or search phrase:

```sh
node ../commands/prepare-delivery-context.ts --require-linked-request --query "<item>"
```

On failure, report `stage` and `reason`, then stop. This is the same context
preparation used by `/ready`. Branch and HEAD are verified in the inspection
snapshot step without switching branches.

### 2. Inspect the Request

On success, follow `./inspect-execute.md` with the returned `delivery_context`.
