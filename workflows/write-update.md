# Write Update Branch

## Purpose

Continue `/write` after `mode: update`.

This branch owns update-only setup, then follows shared drafting, confirmation,
assignment, and save execution.

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

### 2. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: update
item_id: resolved official item ID
item_title: resolved official item title
item_description: resolved official item description
item_provider_fields: preserved official provider fields
current_assignment: assignee names, Unassigned, or Unavailable
```

---

## Safety

- Do not treat search results as official item content before reading the
  selected item.
- Do not update an item that has not been identified by provider ID.
- Preserve existing provider fields that the user did not ask to change.
- Do not create a plan, change item status, or start implementation.
