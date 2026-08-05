# Write Confirm Branch

## Purpose

Execute shared drafting, confirmation, assignment, and save behavior for
`/write`.

This branch is called by `./write-create.md` and `./write-update.md`.

---

## Entry Condition

Run only from a mode branch with:

- `provider`: resolved item provider.
- `mode`: `create` or `update`.
- mode-specific context required for save:
  - `create`: resolved destination;
  - `update`: resolved official item ID, preserved provider fields, and current
    assignment.

---

## Steps

### 1. Draft One Item

Activate `../agents/item-writer.md` by loading its full profile and the
resources it requires for the current context. Keep its activation internal.

Give the sub-agent:

- the user's request and relevant conversation context;
- the existing item title and description when mode is `update`;
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

### 2. Confirm Item

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

### 3. Resolve Optional Assignment

Always ask what should happen to assignment.

When mode is `create`, ask using `../templates/select-option.md` with:

```text
question: What should happen to assignment?
options:
- Leave item unassigned
- Assign item
```

When mode is `update`, ask using `../templates/select-option.md` with:

```text
question: What should happen to assignment?
options:
- label: Keep current assignment: <current_assignment>
  value: keep
- label: Assign or reassign item
  value: assign
```

If the user leaves the item unassigned or selects `keep`, do not run an
assignment command.

Otherwise, ask for `me` or a person name, then run
`../commands/resolve-item-assignee.md` with the resolved provider and supplied
query.

If exactly one person matches, select that person. If multiple people match,
ask the user to select one using `../templates/select-option.md`. If no person
matches, ask for a refined name. Do not choose implicitly.

### 4. Save Item and Apply Assignment Choice

After explicit content confirmation, run `../commands/save-item.md` with:

- selected mode and provider;
- only the confirmed title and Markdown body;
- destination when mode is `create`;
- existing item ID when mode is `update`.

If assignment choice is `assign`, run `../commands/assign-item.md` with the
saved item ID and selected assignee. Otherwise, leave assignment untouched.

Report the item title, provider ID, link, destination, and resulting assignment
state when available.

---

## Safety

- Do not expose provider IDs in selection labels.
- Do not create a plan, change item status, or start implementation.
