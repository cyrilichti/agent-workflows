# Write Confirm Branch

## Purpose

Guide authoring, confirm, save, and label one item.

---

## Entry Condition

Run only from a mode branch with:

- `provider`: resolved item provider.
- `intention`: initial working context collected for this run.
- `create`: `mode` and resolved `destination`.
- `update`: `mode`, official `item_id`, `item_title`,
  `item_description`, and `item_link` when available.

---

## Steps

### 1. Build Authoring Context and Load the Specialist

Build the working context according to `../templates/authoring-context.md` from
the collected intention and, for updates, the official item content.

Read the complete `../agents/item-writer.md` profile and apply it directly to
the working context. Its qualification output follows
`../templates/item-understanding.md`; its drafting output follows
`../templates/item.md`.

When the activation context explicitly requests `to-spec` or a specification
format, record `to_spec: accepted`. Do not infer this field from detailed or
internally consistent input.

### 2. Qualify the Need

When the activation context explicitly requests immediate drafting, or the
request is purely mechanical and requires no substantive decision, continue to
Step 4. Otherwise, ask `item-writer` to qualify the working context and follow
exactly one returned phase:

- focused question: collect one answer or source, update the working context,
  and repeat this step;
- `to-spec` suggestion: present its reason, then ask using
  `../templates/select-option.md` with:

  ```text
  question: Do you want to use the suggested specification format?
  options:
  - Use specification format
  - Continue without specification format
  ```

  Record `to_spec: accepted` after acceptance or `to_spec: declined` after
  refusal, then repeat this step;
- understanding summary: continue to Step 3.

If the user leaves a blocking question unanswered, ask whether to preserve it
as an open question.

### 3. Confirm Understanding

Present the returned understanding summary using
`../templates/item-understanding.md`, then ask using
`../templates/select-option.md` with:

```text
question: What do you want to do with this understanding?
options:
- Confirm understanding
- Adjust understanding
```

- `Adjust understanding`: collect one adjustment, update the working context,
  and return to Step 2;
- `Confirm understanding`: replace `intention` with the exact summary and
  continue to Step 4.

Stop without drafting or mutation when confirmation is refused or unavailable.
Honor a selected Skill's terminal-turn rule before continuing to Step 4.

### 4. Draft and Present the Item

Ask `item-writer` to draft from the current working context. Require exactly one
complete proposed item following `../templates/item.md`, then present it using
`../templates/item-preview.md` followed by its current review notes.

### 5. Confirm or Adjust the Item

Require the latest complete preview or localized change summary to reflect the
current authoring context. Then ask using
`../templates/select-option.md` with:

```text
question: What do you want to do with this item?
options:
- Save item
- Adjust item
```

If the user selects `Adjust item`, update the working context with
`current_proposal` and `last_adjustment`, then have `item-writer` determine
whether the adjustment materially changes the confirmed need. Return to Step 2
when it does. Otherwise ask `item-writer` for the revised item, present it
according to `../templates/item-change-summary.md`, and repeat this step.

Do not continue until the user explicitly selects `Save item`.
If confirmation is refused or unavailable, stop without mutation.

### 6. Save and Label Item

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
