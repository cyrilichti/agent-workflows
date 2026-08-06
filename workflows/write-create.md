# Write Create Branch

## Purpose

Resolve create-only context, then follow the shared execution.

---

## Entry Condition

Run only from `./write.md` after mode selection with:

- `intention`: light need description collected for this run.

---

## Steps

### 1. Collect Destination Expression

Reuse an available `destination` or destination query. Otherwise ask for a
destination name. Do not resolve the provider before this input exists.

### 2. Resolve Provider and Destination

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

When the destination is not already resolved, run
`../commands/resolve-item-destination.md` with the provider and the collected
query.

Select the single match, or ask with `../templates/select-option.md` when
several match. Keep the provider and destination in this branch; do not pass
provider operations or mutation responsibility to the writing sub-agent.

### 3. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: create
destination: selected create destination
intention: collected need description
```

---

## Safety

- Do not resolve or read an existing item in this branch.
- Do not resolve a destination without an explicit expression unless one is
  already available for this run.
- Do not load provider operations other than those required by the active step.
