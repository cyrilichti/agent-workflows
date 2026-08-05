# Write Update Branch

## Purpose

Resolve update-only context, then follow the shared execution.

---

## Entry Condition

Run only from `./write.md` after mode selection with:

- `provider`: carried item provider.

---

## Steps

### 1. Resolve Existing Item

If an official item is already carried for this run (`item_id` plus official
title and description), reuse it.

Otherwise run `../commands/resolve-existing-item.md` with:

```text
provider: carried item provider
reference: user-provided provider item ID, when available
fields: assignment
```

Keep the returned official item in carried state: `item_id`, title,
description, `current_assignment`, and `link` when the official read returned
it.

Identify the resolved item to the user using its title, status, and link when
available.

### 2. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: carried item provider
mode: update
item_id: carried official item ID
item_title: carried official item title
item_description: carried official item description
current_assignment: carried assignee names, Unassigned, or Unavailable
item_link: carried official item link, when available
```

---

## Safety

- Do not treat a search result as official item content.
