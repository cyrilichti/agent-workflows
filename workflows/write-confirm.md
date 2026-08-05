# Write Confirm Branch

## Purpose

Draft, confirm, optionally assign, and save one item.

---

## Entry Condition

Run only from a mode branch with:

- `provider`: carried item provider.
- `create`: `mode` and carried `destination`.
- `update`: `mode`, carried official `item_id`, `item_title`,
  `item_description`, `current_assignment`, and `item_link` when available.

---

## Steps

### 1. Draft One Item

Assemble `../templates/authoring-context.md` with only applicable fields:

- `intention`, and `facts_constraints` / `open_questions` / `sources` when known;
- `official_title` and `official_body` when mode is `update`.

Activate `../agents/item-writer.md` and give it:

- the authoring-context packet;
- `../templates/item.md` as its output contract.

Continue until it returns one sufficiently defined proposal.

During those exchanges, rebuild and resend the packet after each answer or new
source. Integrate only useful information; remove resolved `open_questions` and
superseded content.

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

Otherwise, if a selected assignee value is already carried for this run, reuse
it. If not, ask for `me` or a person name, then run
`../commands/resolve-item-assignee.md` with the carried provider and supplied
query.

When multiple people match, ask the user to select one using
`../templates/select-option.md`. Keep the selected assignee value in carried
state.

### 4. Save Item and Apply Assignment Choice

Run `../commands/save-item.md` with:

- selected mode and carried provider;
- only the confirmed title and Markdown body;
- carried destination when mode is `create`;
- carried item ID when mode is `update`.

Keep the saved item ID, title, and link returned by `save-item` in carried
state.

If assignment choice is `assign`, run `../commands/assign-item.md` with the
carried saved item ID and selected assignee. Otherwise, leave assignment
untouched.

Finish according to `../goals/write-complete.md`, using carried fields and the
reporting precedence defined in `./write.md`.

---

## Safety

- Do not expose provider IDs in selection labels.
