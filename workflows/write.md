# Write

## Purpose

Create or reformulate exactly one provider-backed item, then optionally
assign it.

---

## Required Context

Load `../goals/write-complete.md` once as this workflow's completion contract.

Follow `../rules/user-facing-output.md`.

Follow `../rules/mutation-response.md`.

---

## Steps

### 1. Select Authoring Mode

Ask the user using `../templates/select-option.md` with:

```text
question: What do you want to write?
options:
- label: Create a new item
  value: create
- label: Reformulate an existing item
  value: update
```

Do not resolve the item provider before this choice. Keep the prefix through
playbook entry and this first user choice free of provider resolution.

### 2. Collect Need Description

Ask for a light free-form description of the need. Keep it as this run's
`intention`.

Do not activate `item-writer` or assemble `../templates/authoring-context.md`
before that description exists.

### 3. Follow One Mode Branch

After the need description is collected, follow exactly one branch:

- for `create`, follow `./write-create.md`;
- for `update`, follow `./write-update.md`.

Pass `intention` into the chosen branch. Do not resolve the item provider in
this workflow; each branch resolves it when its first provider operation needs
it.

---

## Safety

- Do not resolve the item provider before the user selects create or update.
- Do not follow both branches in one execution.
- Do not create a plan, change item status, or start implementation.
- Do not announce that the intention was confirmed after collecting the need
  description.
