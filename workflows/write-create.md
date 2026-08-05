# Write Create Branch

## Purpose

Resolve create-only context, then follow the shared execution.

---

## Entry Condition

Run only from `./write.md` after mode selection with:

- `provider`: carried item provider.

---

## Steps

### 1. Resolve Destination

If a create `destination` is already carried for this run, reuse it.

Otherwise run `../commands/resolve-item-destination.md` with the carried
provider.

If no destination matches, ask the user to refine the destination. If
exactly one destination matches, select it. If multiple destinations match, ask
the user to select one using `../templates/select-option.md`.

Keep the selected destination in the workflow carried state.

### 2. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: carried item provider
mode: create
destination: carried create destination
```

---

## Safety

- Do not resolve or read an existing item in this branch.
