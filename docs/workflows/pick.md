# `/pick`

It guides the user from selecting a backlog item to starting its implementation
with an approved plan.

```text
Select → Summary → Plan → In progress → Work
```

## Selection

`/pick` lists the items assigned to the user that are ready to start. The user
selects one of them, or provides an item ID or URL directly.

The selected item is then loaded from the configured provider so its official
content remains the source of truth.

## Summary

Before planning starts, `/pick` presents the item's objective, business context,
and acceptance criteria. Missing information is called out instead of being
invented.

## Planning

`/pick` passes the item context to `/plan`. The user can adjust the resulting
plan until explicitly approving it.

The item remains unchanged while the plan is being prepared.

## Start

After plan approval, control returns to `/pick`. It moves the selected item to
in progress, then hands the approved plan to `/work`.

If selection, item loading, or planning fails, the item is not started.