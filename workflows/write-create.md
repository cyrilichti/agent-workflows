# Write Create Branch

## Purpose

Resolve create-only context, then follow the shared execution.

---

## Steps

### 1. Collect Need Description

Ask for a light free-form description of the need. Keep it as this run's
`intention`.

### 2. Collect Destination Reference

Reuse an available destination reference. Otherwise ask where the item should
be created.

### 3. Resolve Provider and Destination

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Run `../commands/resolve-item-destination.md` with the provider and the
collected reference. Use the returned destination.

### 4. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: create
destination: selected create destination
intention: collected need description
```
