# Write Update Branch

## Purpose

Resolve update-only context, then follow the shared execution.

---

## Entry Condition

Run only from `./write.md` after mode selection with:

- `provider`: resolved item provider.

---

## Steps

### 1. Resolve Existing Item

Run `../commands/resolve-existing-item.md` with:

```text
provider: resolved item provider
reference: user-provided provider item ID, when available
fields: assignment
```

Identify the resolved item to the user using its title, status, and link when
available.

### 2. Follow Shared Execution

Follow `./write-confirm.md` with:

```text
provider: resolved item provider
mode: update
item_id: resolved official item ID
item_title: resolved official item title
item_description: resolved official item description
current_assignment: assignee names, Unassigned, or Unavailable
item_link: official item link, when available
```
