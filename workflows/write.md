# Write

## Purpose

Create a complete backlog item or improve an existing one, then assign it to a
person.

This workflow stops after the item has been saved and assigned.

---

## Entry Condition

Run this workflow after `./play-book.md` selects `write`, when the `write` skill
is explicitly invoked, or when another workflow delegates backlog item
authoring to it.

---

## Required Context

A backlog item is ready to save when it has:

* title;
* context and problem;
* objective;
* expected outcome;
* verifiable acceptance criteria.

Scope and exclusions are optional when they clarify the boundary of the work.

---

## Steps

### 1. Resolve Provider

Run `../commands/resolve-backlog-provider.md` with:

```text
workflow: backlog
```

### 2. Select Authoring Mode

Ask the developer using `../templates/select-option.md` with:

```text
question: What do you want to write?
options:
- Create a new backlog item
- Improve an existing backlog item
```

### 3. Resolve Existing Item

Skip this step when creating a new item.

If the developer provides an item ID or URL, run
`../commands/read-backlog-item.md` and validate the item.

Otherwise, ask for the item title or a short title search phrase, then run
`../commands/search-backlog-items.md`. Do not list the full backlog.

* If no item matches, ask the developer to refine the search or stop.
* If exactly one item matches, select it.
* If multiple items match, ask the developer to select one using
  `../templates/select-option.md`. Use readable labels with title, status, and
  destination when available, and attach the provider ID as the internal value.

Read the selected item with `../commands/read-backlog-item.md` and present it
using `../templates/ticket-summary.md`.

### 4. Interview Developer

Activate `../agents/interviewer.md` with the required context from this workflow
and the existing item content when available.

Ask only for missing or ambiguous information. Continue in focused rounds until
all required context is present.

### 5. Resolve Destination

When creating an item, run `../commands/resolve-backlog-destination.md`.

If no destination matches, ask the developer to refine the destination. If
exactly one destination matches, select it. If multiple destinations match, ask
the developer to select one using `../templates/select-option.md`.

Skip this step when improving an existing item.

### 6. Resolve Assignee

Ask who should be assigned. Accept `me` or a name search, then run
`../commands/resolve-backlog-assignee.md`.

If exactly one person matches, select that person. If multiple people match,
ask the developer to select one using `../templates/select-option.md`.

### 7. Confirm Item

Verify that every required context field is present. If not, return to the
interview step for only the missing information.

Present the proposed item using `../templates/ticket-summary.md`. Present the
selected destination when creating and the selected assignee as confirmation
metadata, then ask using `../templates/select-option.md` with:

```text
question: What do you want to do with this backlog item?
options:
- Save item
- Adjust item
```

If the developer selects `Adjust item`, collect the requested changes and
present the item for confirmation again.

### 8. Save and Assign Item

After explicit confirmation, run `../commands/save-backlog-item.md` with the
selected mode, provider, confirmed `ticket-summary` content, existing item ID
when available, and destination when creating.

Run `../commands/assign-backlog-item.md` with the saved item ID and selected
assignee.

Report the item title, provider ID, link, destination, and assignee when
available.

---

## Safety

* Do not create or update an item before the developer confirms the final
  content.
* Do not treat search results as official item content before reading the
  selected item.
* Do not update an item that has not been identified by provider ID.
* Preserve existing provider fields that the developer did not ask to change.
* Do not expose provider IDs in selection labels.
* Do not create a plan, change item status, or start implementation.
* If saving succeeds but assignment fails, report the saved item and the failed
  assignment explicitly.

---

## Success Criteria

This workflow is complete when:

* one complete backlog item has been created or updated;
* the developer has confirmed its content;
* the item has been assigned to the selected person;
* the saved item link and assignment have been reported.
