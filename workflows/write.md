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

## Carried State

This workflow owns resolved state for one continuous execution. Pass explicit
inputs into mode branches and commands. Commands stay request/response and must
not invent a hidden cache.

### Fields

Carry after successful resolution or read:

- `provider` — from `agent-workflows.yaml` via `resolve-item-provider`
- official item core — `item_id`, title, description; plus `link` when the
  official read returned it
- `destination` — create path only, after destination resolution
- assignment as two values when needed:
  - `current_assignment` — display string for Keep-current UX
    (`assignee names`, `Unassigned`, or `Unavailable`)
  - selected assignee value — provider value for `assign-item`
- `link` — after create/update mutation when the mutation returns it; pre-save
  absence is not a re-read trigger

### Population and handoff

- Resolve `provider` once at the start of a continuous successful run.
  Re-resolve only when the run stops and restarts, or when resolution failed
  and must be retried.
- Pass `provider` into the chosen mode branch, then into `write-confirm.md`
  and every command call for that run.
- Create: after destination resolution, pass `provider`, `mode: create`, and
  `destination`.
- Update: after official read, pass `provider`, `mode: update`, `item_id`,
  title, description, and `current_assignment`. Include `link` when the read
  returned it.
- Keep `resolve-existing-item`’s mandatory `read-item` after search selection.
  Search hits are never official content. A user-refined search phrase is a
  new query, not still-valid reuse.
- Destination and assignee resolution still run when that step has not yet
  produced a carried value for this run.
- Never put provider, link, assignment, destination, or mutation
  responsibility into the `item-writer` authoring-context packet.

### Invalidation

Invalidate only fields affected by a mutation:

- create → set `item_id` and `link` from the mutation response
- update → refresh title, description, and `link` from the mutation when
  returned
- assign → refresh resulting assignment from the mutation; do not drop the
  rest of the official snapshot
- update + `keep` → no assign mutation; report carried `current_assignment`
- save succeeds / assign fails → report save mutation `link` and partial
  success; do not invent assignment from the failed mutation

External staleness during a long draft loop is accepted (no TTL or pre-save
refresh).

### Indispensable reporting fields

For `../goals/write-complete.md`, these fields must be available when
applicable: saved `item_id`, title, `link`, and resulting assignment (including
`keep` / unassigned outcomes).

Reporting precedence after a mutation: mutation response → carried selection
or official-read display → conditional `read-item` only if an indispensable
field is missing or ambiguous → `Unavailable`.

---

## Steps

### 1. Resolve Provider

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Keep the resolved provider in this workflow's carried state. Do not pass
provider operations or mutation responsibility to the writing sub-agent.

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
