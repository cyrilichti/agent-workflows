# Write Create Branch

## Purpose

Resolve create-only context, then follow the shared execution.

---

## Steps

### 1. Collect Need Description

Ask for a light free-form description of the need. Keep it as this run's
`intention`.

### 2. Collect Destination Expression

Reuse an available destination query. Otherwise ask for a destination name.

### 3. Resolve Provider and Destination

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

### 4. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: create
destination: selected create destination
intention: collected need description
```
