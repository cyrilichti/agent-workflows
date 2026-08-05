# Write

## Purpose

Create or reformulate exactly one provider-backed item, then optionally
assign it.

---

## Entry Condition

Run this workflow after `./play-book.md` selects `write`, when the `write` Skill
is explicitly invoked, or when another workflow delegates item
authoring to it.

---

## Required Context

Load `../goals/write-complete.md` once as this workflow's completion contract.

Keep successful orchestration internal. Surface only required questions, the
proposal, blockers, and the saved result unless the user asks for details.

---

## Steps

### 1. Resolve Provider

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Keep the resolved provider in this workflow. Do not pass provider operations or
mutation responsibility to the writing sub-agent.

### 2. Select Authoring Mode

Ask the user using `../templates/select-option.md` with:

```text
question: What do you want to write?
options:
- label: Create a new item
  value: create
- label: Reformulate an existing item
  value: update
```

### 3. Follow One Mode Branch

After mode selection, follow exactly one branch:

- for `create`, follow `./write-create.md`;
- for `update`, follow `./write-update.md`.

Pass the resolved provider into the chosen branch.

---

## Safety

- Do not follow both branches in one execution.
- Do not create a plan, change item status, or start implementation.
