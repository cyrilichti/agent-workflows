# Write Confirm Branch

## Purpose

Guide authoring, confirm, optionally assign, and save one item.

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

### 1. Build Authoring Context and Load the Specialist

Build the working context according to `../templates/authoring-context.md` from
the collected intention and, for updates, the official item content.

Read the complete `../agents/item-writer.md` profile and apply it directly to
the working context with `../templates/item.md` as its output contract.

### 2. Draft and Present Early

Present the improved first proposal using `../templates/item-preview.md` before
collecting further authoring input, followed by its current review notes.

### 3. Collect Authoring Input

Collect the answers or sources requested by `item-writer`. If the user leaves a
blocking question unanswered, ask whether to preserve it as an open question.

After each meaningful answer, new source, or requested revision, update the
same authoring context incrementally and have the active `item-writer` reassess
the current need and Skill. Continue the focused interaction without rendering
the complete proposal again.

Produce and present a new complete proposal with its review notes when:

- every blocker is answered or visibly preserved and the content reaches a
  review point;
- the user asks to see or revise the draft.

Continue until every blocking question is answered or visibly preserved in the
proposal.

### 4. Confirm Item

Present the latest complete proposal and review notes unless they already
reflect the current authoring context. Then ask using
`../templates/select-option.md` with:

```text
question: What do you want to do with this item?
options:
- Save item
- Adjust item
```

If the user selects `Adjust item`, update the working context with
`current_proposal` and `last_adjustment`, then resume step 3.

Do not continue until the user explicitly selects `Save item`.
If confirmation is refused or unavailable, stop without mutation.

### 5. Resolve Optional Assignment

Ask using `../templates/select-option.md` with:

```text
question: What should happen to assignment?
options:
- Choose an assignee
- Skip assignment
```

If the user selects `Skip assignment`, leave a new item unassigned or preserve
an existing item's current assignment. Do not run an assignment command.

Otherwise, ask for `me`, a name, or an email, then run
`../commands/resolve-item-assignee.md` with the provider and that query.
Run that resolution only after the user selects `Choose an assignee`.

Select the single match. When several match, ask using
`../templates/select-option.md` with:

```text
question: Who should be assigned?
options:
- label: <readable name and email when available>
  value: <internal provider assignee value>
```

### 6. Save Item and Apply Assignment Choice

Run `../commands/save-item.md` with:

- selected mode and provider;
- only the confirmed title and Markdown body;
- destination when mode is `create`;
- existing item ID when mode is `update`.

Use the `save-item` result for subsequent assignment and reporting.

If assignment choice is `Choose an assignee`, run
`../commands/assign-item.md` with the saved item ID and selected assignee.
Otherwise, leave assignment untouched.

Finish according to `../goals/write-complete.md`. Present the outcome using
`../templates/write-result.md` with:

```text
Provider: resolved provider display name
Item title: returned or carried item title, or Item unavailable
Item URL: returned or carried item URL, when available
Status: returned or carried provider status, or Unavailable
Assignment: observed assignee names, Unassigned, or Unavailable
```
