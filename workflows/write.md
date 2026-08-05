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

Do not impose a shared ticket schema. An item is ready to confirm when the
`item-writer` returns exactly one meaningful title and one free-form
Markdown body using `../templates/item.md`.

The item may be based on the current conversation, an existing item, or code,
specifications, files, and URLs explicitly identified by the user.

Keep successful orchestration internal. User-facing interaction is limited to
questions that require a choice or missing information, the proposed item,
confirmation, assignment, blockers or failures, and the final saved result.
Do not narrate provider resolution, configuration sources, agent activation,
or tool calls unless the user explicitly asks.

---

## Steps

### 1. Resolve Provider

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Keep the resolved provider in this workflow. Do not pass provider operations or
mutation responsibility to the writing sub-agent.

Do not announce a successful resolution or its configuration source. Report
only a missing, invalid, or unavailable provider.

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

Pass the resolved provider and selected mode into the chosen branch.

---

## Safety

- Do not follow both branches in one execution.
- Do not create a plan, change item status, or start implementation.
