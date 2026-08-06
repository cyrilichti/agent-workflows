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

Reuse a create `destination` already available for this run.

Otherwise ask for a name or path expression, then run
`../commands/resolve-item-destination.md` with the provider and that query.

Select the single match, or ask with `../templates/select-option.md` when
several match. Keep the selected destination for this run.

### 2. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: create
destination: selected create destination
```

---

## Safety

- Do not resolve or read an existing item in this branch.
- Do not resolve a destination without an explicit expression unless one is
  already available for this run.
