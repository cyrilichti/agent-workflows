# Write Create Branch

## Purpose

Resolve create-only context, then follow the shared execution.

---

## Steps

### 1. Collect Destination Expression

Reuse an available destination query. Otherwise ask for a destination name.

### 2. Resolve Provider and Destination

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Run `../commands/resolve-item-destination.md` with the provider and the
collected query.

Select the single match. When several match, ask using
`../templates/select-option.md` with:

```text
question: Where should the item be created?
options:
- label: <readable destination label>
  value: <internal provider destination value>
```

### 3. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: create
destination: selected create destination
intention: collected need description
```
