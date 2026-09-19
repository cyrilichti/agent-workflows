# Write Create Branch

## Purpose

Resolve create-only context, then follow the shared execution.

---

## Steps

### 1. Collect Need Description

Reuse the initial intention from the workflow activation context when it
contains the need to author. Otherwise ask for a light free-form description.
Keep the result as this run's `intention`.

### 2. Collect Destination Reference

Keep an explicit destination reference from the activation context when one is
available. Otherwise keep the current project name from the active execution
context when available. Do not ask for a destination before attempting either
source.

### 3. Resolve Provider and Destination

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Run `../commands/resolve-item-destination.md` with:

```text
provider: resolved item provider
reference: explicit destination reference, when supplied
current_project_name: current project name from the active execution context,
  when available
```

Use the returned destination.

### 4. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: create
destination: selected create destination
intention: collected need description
```
