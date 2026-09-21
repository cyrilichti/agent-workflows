# Write Create Branch

## Purpose

Resolve create-only context, then follow the shared execution.

---

## Steps

### 1. Resolve Provider

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

### 2. Resolve Destination

Keep an explicit destination reference from the activation context when one is
available. Otherwise keep the current project name from the active execution
context when available.

Run `../commands/resolve-item-destination.md` with:

```text
provider: resolved item provider
reference: explicit destination reference, when supplied
current_project_name: current project name from the active execution context,
  when available
```

Use the returned destination.

### 3. Collect Initial Need Context

Reuse the initial intention from the workflow activation context when it
contains the need to author. Otherwise ask for a light free-form starting
context. Do not treat detail or internal consistency as confirmation that the
need is ready to draft. Keep the result as this run's `intention`.

### 4. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: create
destination: selected create destination
intention: collected need description
```
