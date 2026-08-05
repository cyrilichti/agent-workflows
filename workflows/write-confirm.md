# Write Confirm Branch

## Purpose

Draft, confirm, optionally assign, and save one item.

---

## Entry Condition

Run only from a mode branch with:

- `provider`: resolved item provider.
- `create`: `mode` and resolved `destination`.
- `update`: `mode`, official `item_id`, `item_title`, `item_description`, and
  `current_assignment`.

---

## Steps

### 1. Draft One Item

Assemble `../templates/authoring-context.md` with only applicable fields:

- `intention`, and `facts_constraints` / `open_questions` / `sources` when known;
- `official_title` and `official_body` when mode is `update`.

Activate `../agents/item-writer.md` and give it:

- the authoring-context packet;
- `../templates/item.md` as its output contract.

Continue until it returns one sufficiently defined proposal. Its profile owns
Skill routing and side-effect boundaries.

### 2. Confirm Item

Present the proposal using `../templates/item-preview.md`, then ask using
`../templates/select-option.md` with:

```text
question: What do you want to do with this item?
options:
- Save item
- Adjust item
```

If the user selects `Adjust item`, reassemble the packet with
`current_proposal` and `last_adjustment`, give it to the active `item-writer`,
and repeat this step with its revised proposal.

Do not continue until the user explicitly selects `Save item`.
If confirmation is refused or unavailable, stop without mutation.

### 3. Resolve Optional Assignment

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

When multiple people match, ask the user to select one using
`../templates/select-option.md`.

### 4. Save Item and Apply Assignment Choice

Run `../commands/save-item.md` with:

- selected mode and provider;
- only the confirmed title and Markdown body;
- destination when mode is `create`;
- existing item ID when mode is `update`.

If assignment choice is `assign`, run `../commands/assign-item.md` with the
saved item ID and selected assignee. Otherwise, leave assignment untouched.

Finish according to `../goals/write-complete.md`.

---

## Safety

- Do not expose provider IDs in selection labels.
