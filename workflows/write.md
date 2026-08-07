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
- Create a new item
- Reformulate an existing item
```

Do not resolve the item provider before this choice. Keep the prefix through
playbook entry and this first user choice free of provider resolution.

### 2. Follow One Mode Branch

Follow exactly one branch:

- for `Create a new item`, follow `./write-create.md`;
- for `Reformulate an existing item`, follow `./write-update.md`.

Each branch owns when to collect the need description.

---

## Safety

- Do not create a plan, change item status, or start implementation.
