# Write Confirm Branch

## Purpose

Draft, confirm, optionally assign, and save one item.

---

## Entry Condition

Run only from a mode branch with:

- `provider`: resolved item provider.
- `intention`: light need description collected for this run.
- `create`: `mode` and resolved `destination`.
- `update`: `mode`, official `item_id`, `item_title`,
  `item_description`, `current_assignment`, and `item_link` when available.

---

## Steps

### 1. Draft One Item

Build the first `../templates/authoring-context.md` packet from the collected
`intention` before activating `item-writer`. Include only applicable fields:

- `intention` from the collected need description;
- `facts_constraints` / `open_questions` / `sources` when known;
- `official_title` and `official_body` when mode is `update`.

Keep destination, item ID, status, assignees, links, and other provider results
in this workflow only. Do not put them in the packet.

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

Otherwise, ask for `me`, a name, or an email, then run
`../commands/resolve-item-assignee.md` with the provider and that query.
Run that resolution only after the user selects `assign`.

Select the single match, or ask with `../templates/select-option.md` when
several match.

### 4. Save Item and Apply Assignment Choice

Run `../commands/save-item.md` with:

- selected mode and provider;
- only the confirmed title and Markdown body;
- destination when mode is `create`;
- existing item ID when mode is `update`.

Use the `save-item` result for subsequent assignment and reporting.

If assignment choice is `assign`, run `../commands/assign-item.md` with the
saved item ID and selected assignee. Otherwise, leave assignment untouched.

Finish according to `../goals/write-complete.md`.

---

## Safety

- Do not expose provider IDs in selection labels.
