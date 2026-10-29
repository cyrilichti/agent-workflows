# Inspect Standalone Branch

## Steps

### 1. Prepare the Delivery Context

Run from this file's directory. For an item ID or native URL:

```sh
node ../commands/prepare-delivery-context.ts --inspect "<item>"
```

For a title or search phrase:

```sh
node ../commands/prepare-delivery-context.ts --inspect --query "<item>"
```

On failure, report `stage` and `reason`, then stop. The command prepares the
same delivery context as `/ready`, then checks the current branch and HEAD
against the linked request. It does not switch branches.

### 2. Inspect the Request

On success, follow `./inspect-item.md` with the returned `delivery_context`.
