# Write Create Branch

## Purpose

Resolve create-only context, then follow the shared execution.

---

## Entry Condition

Run only from `./write.md` after mode selection with:

- `intention`: light need description collected for this run.

---

## Steps

### 1. Resolve Provider

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Keep the resolved provider in this branch. Do not pass provider operations or
mutation responsibility to the writing sub-agent.

### 2. Resolve Destination

Reuse a create `destination` already available for this run.

Otherwise ask for a destination name, then run
`../commands/resolve-item-destination.md` with the provider and that query.

Load only that destination operation for this step. Select the single match,
or ask with `../templates/select-option.md` when several match. Keep the
selected destination for this run.

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
