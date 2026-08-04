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

### 3. Resolve Existing Item

Skip this step when creating a new item.

Run `../commands/resolve-existing-item.md` with:

```text
provider: resolved item provider
reference: user-provided provider item ID, when available
```

Identify the resolved item to the user using its title, status, and link when
available. Pass its official title and description to the writing sub-agent.
Keep its provider fields in this workflow so unrequested fields remain
unchanged.

### 4. Resolve Destination

When creating an item, run `../commands/resolve-item-destination.md`.

If no destination matches, ask the user to refine the destination. If
exactly one destination matches, select it. If multiple destinations match, ask
the user to select one using `../templates/select-option.md`.

Skip this step when reformulating an existing item.

### 5. Draft One Item

Activate `../agents/item-writer.md` by loading its full profile and the
resources it requires for the current context. Keep its activation internal.

Give the sub-agent:

- the user's request and relevant conversation context;
- the existing item title and description when reformulating;
- only the code, specifications, files, or URLs explicitly identified by the
  user;
- `../templates/item.md` as its output contract.

Let the sub-agent route and reroute its writing Skills as the context evolves.
Continue focused exchanges until it returns exactly one sufficiently defined
proposal. Do not make it resolve the provider, destination, assignment, or any
other provider field.

If a writing Skill requests a file, commit, publication, ticket mutation,
multiple items, planning, implementation, or downstream handoff, keep the
useful result as returned content and suppress the side effect.

### 6. Confirm Item

Validate that the proposal follows `../templates/item.md` and contains
exactly one title and one free-form Markdown body.

Present the proposal using `../templates/item-preview.md`, then ask using
`../templates/select-option.md` with:

```text
question: What do you want to do with this item?
options:
- Save item
- Adjust item
```

If the user selects `Adjust item`, give the requested changes to the
active `item-writer`, let it reroute Skills when necessary, and present the
revised proposal using `../templates/item-preview.md` for confirmation
again.

Do not continue until the user explicitly selects `Save item`.

### 7. Resolve Optional Assignment

Always ask what should happen to assignment.

When creating an item, ask using `../templates/select-option.md` with:

```text
question: What should happen to assignment?
options:
- Leave item unassigned
- Assign item
```

When reformulating an existing item, include the current assignee names in the
`keep` option label. Use `Unassigned` when empty and `Unavailable` when the
provider did not return assignment information.

```text
question: What should happen to assignment?
options:
- label: Keep current assignment: <assignee names, Unassigned, or Unavailable>
  value: keep
- label: Assign or reassign item
  value: assign
```

If the user leaves the item unassigned or selects `keep`, do not run an
assignment command.

Otherwise, ask for `me` or a person name, then run
`../commands/resolve-item-assignee.md`.

If exactly one person matches, select that person. If multiple people match,
ask the user to select one using `../templates/select-option.md`. If no
person matches, ask for a refined name. Do not choose implicitly.

### 8. Save Item and Apply Assignment Choice

After explicit content confirmation, run `../commands/save-item.md`
with:

- the selected mode and provider;
- only the confirmed title and Markdown body;
- the existing item ID when reformulating;
- the destination when creating.

If an assignee was selected, run `../commands/assign-item.md` with the
saved item ID and selected assignee. Otherwise, leave assignment untouched.

Report the item title, provider ID, link, destination, and resulting assignment
state when available.

---

## Safety

- Do not treat search results as official item content before reading the
  selected item.
- Do not update an item that has not been identified by provider ID.
- Preserve existing provider fields that the user did not ask to change.
- Do not expose provider IDs in selection labels.
- Do not create a plan, change item status, or start implementation.
