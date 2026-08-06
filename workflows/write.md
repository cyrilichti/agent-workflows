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

## Run State

Reuse successful command results only within the current run; commands keep no
hidden cache. Replace only fields affected by mutation. A search selection
still requires its official read.

After mutation, report from its response, then still-valid state. Read once
only for a missing or ambiguous required field; otherwise use `Unavailable`.

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

### 3. Resolve Provider

After the need description is collected, run
`../commands/resolve-item-provider.md` with:

```text
context: item
```

Keep the resolved provider in this workflow. Do not pass provider operations or
mutation responsibility to the writing sub-agent.

### 4. Follow One Mode Branch

After provider resolution, follow exactly one branch:

- for `create`, follow `./write-create.md`;
- for `update`, follow `./write-update.md`.

Pass the resolved provider and `intention` into the chosen branch.

---

## Safety

- Do not resolve the item provider before the user selects create or update.
- Do not follow both branches in one execution.
- Do not create a plan, change item status, or start implementation.
