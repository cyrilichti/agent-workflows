# Write Update Branch

## Purpose

Resolve update-only context, then follow the shared execution.

---

## Entry Condition

Run only from `./write.md` after mode selection with:

- `intention`: light need description collected for this run.

---

## Steps

### 1. Collect Item Expression

Reuse an available provider item ID or title query. Otherwise ask for the item
title or a short title search phrase. Do not resolve the provider before this
input exists.

### 2. Resolve Provider and Item

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Then run `../commands/resolve-existing-item.md` with:

```text
provider: resolved item provider
reference: user-provided provider item ID, when available
query: collected title query, when no item ID is available
fields: assignment
```

Load only that official-item read path for this step. Identify the resolved
item to the user using its title, status, and link when available.

### 3. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: update
item_id: resolved official item ID
item_title: resolved official item title
item_description: resolved official item description
current_assignment: assignee names, Unassigned, or Unavailable
item_link: official item link, when available
intention: collected need description
```

---

## Safety

- Do not load provider operations other than those required by the active step.
