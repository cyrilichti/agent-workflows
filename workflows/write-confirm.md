# Write Confirm Branch

## Purpose

Guide authoring, confirm, save, and label one item.

---

## Entry Condition

Run only from a mode branch with:

- `provider`: resolved item provider.
- `intention`: light need description collected for this run.
- `create`: `mode` and resolved `destination`.
- `update`: `mode`, official `item_id`, `item_title`,
  `item_description`, and `item_link` when available.

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
the current need and Skill. Compare the resulting proposal with the last
presented proposal.

Present only the changed content with `../templates/item-change-summary.md`
when the revision is localized. Present a new complete proposal with its
review notes when:

- its title or overall structure changes;
- several sections change materially;
- the user explicitly asks to see the complete proposal.

Continue until every blocking question is answered or visibly preserved in the
proposal.

### 4. Confirm Item

Require the latest complete preview or localized change summary to reflect the
current authoring context. Do not repeat a complete preview solely because a
localized revision is ready for confirmation. Then ask using
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

### 5. Save and Label Item

Run `../commands/save-item.md` with:

- selected mode and provider;
- only the confirmed title and Markdown body;
- destination when mode is `create`;
- existing item ID when mode is `update`.

Use the `save-item` result for subsequent labeling and reporting, then run
`../commands/apply-item-label.md` with:

```text
provider: resolved item provider
item_id: saved item ID
label: agent-shaped
```

Finish according to `../goals/write-complete.md`. Present the outcome using
`../templates/write-result.md` with:

```text
Provider: resolved provider display name
Item title: returned or carried item title, or Item unavailable
Item URL: returned or carried item URL, when available
Status: returned or carried provider status, or Unavailable
Label applied: returned label result
Label reason: returned reason when the label was not applied
```
