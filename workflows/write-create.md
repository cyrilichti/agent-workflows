# Write Create Branch

## Purpose

Continue `/write` after `mode: create`.

This branch owns create-only setup, then follows shared drafting, confirmation,
assignment, and save execution.

---

## Entry Condition

Run only from `./write.md` after mode selection with:

- `provider`: resolved item provider.
- `mode`: `create`.

---

## Steps

### 1. Resolve Destination

Run `../commands/resolve-item-destination.md`.

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
- Do not expose provider IDs in selection labels.
- Do not create a plan, change item status, or start implementation.
