# Write Create Branch

## Purpose

Resolve create-only context, then follow the shared execution.

---

## Entry Condition

Run only from `./write.md` after mode selection with:

- `provider`: resolved item provider.

---

## Steps

### 1. Resolve Destination

Run `../commands/resolve-item-destination.md` with the resolved provider.

If no destination matches, ask the user to refine the destination. If
exactly one destination matches, select it. If multiple destinations match, ask
the user to select one using `../templates/select-option.md`.

### 2. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: create
destination: resolved create destination
```

---

## Safety

- Do not resolve or read an existing item in this branch.
