# Write Create Branch

## Purpose

Continue `/write` after `mode: create`.

This branch owns create-only steps and create-specific assignment choices,
then follows confirmation and save execution.

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

### 2. Resolve Optional Assignment

Always ask what should happen to assignment using
`../templates/select-option.md` with:

```text
question: What should happen to assignment?
options:
- Leave item unassigned
- Assign item
```

If the user leaves the item unassigned, do not run an assignment command.

Otherwise, ask for `me` or a person name, then run
`../commands/resolve-item-assignee.md`.

If exactly one person matches, select that person. If multiple people match,
ask the user to select one using `../templates/select-option.md`. If no
person matches, ask for a refined name. Do not choose implicitly.

### 3. Follow Confirmation and Save

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: create
destination: resolved create destination
assignment_choice: leave-unassigned or assign
assignee: resolved assignee, when assignment_choice is assign
```

---

## Safety

- Do not resolve or read an existing item in this branch.
- Do not expose provider IDs in selection labels.
- Do not create a plan, change item status, or start implementation.
