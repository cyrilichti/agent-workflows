# Write Update Branch

## Purpose

Continue `/write` after `mode: update`.

This branch owns update-only steps and update-specific assignment choices,
then follows confirmation and save execution.

---

## Entry Condition

Run only from `./write.md` after mode selection with:

- `provider`: resolved item provider.
- `mode`: `update`.

---

## Steps

### 1. Resolve Existing Item

Run `../commands/resolve-existing-item.md` with:

```text
provider: resolved item provider
reference: user-provided provider item ID, when available
```

Identify the resolved item to the user using its title, status, and link when
available. Pass its official title and description to the writing sub-agent.
Keep its provider fields in this workflow so unrequested fields remain
unchanged.

### 2. Resolve Optional Assignment

Always ask what should happen to assignment.

Include the current assignee names in the `keep` option label. Use
`Unassigned` when empty and `Unavailable` when the provider did not return
assignment information.

Ask using `../templates/select-option.md` with:

```text
question: What should happen to assignment?
options:
- label: Keep current assignment: <assignee names, Unassigned, or Unavailable>
  value: keep
- label: Assign or reassign item
  value: assign
```

If the user selects `keep`, do not run an assignment command.

Otherwise, ask for `me` or a person name, then run
`../commands/resolve-item-assignee.md`.

If exactly one person matches, select that person. If multiple people match,
ask the user to select one using `../templates/select-option.md`. If no
person matches, ask for a refined name. Do not choose implicitly.

### 3. Follow Confirmation and Save

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: update
item_id: resolved official item ID
item_title: resolved official item title
item_description: resolved official item description
item_provider_fields: preserved official provider fields
assignment_choice: keep or assign
assignee: resolved assignee, when assignment_choice is assign
```

---

## Safety

- Do not treat search results as official item content before reading the
  selected item.
- Do not update an item that has not been identified by provider ID.
- Preserve existing provider fields that the user did not ask to change.
- Do not create a plan, change item status, or start implementation.
