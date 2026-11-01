# Write Execute

## Input

| Input | Requirement |
| --- | --- |
| `mode` | `create` or `update` |
| `provider` | Resolved item provider |
| `intention` | Need or revision context |
| `destination` | Required for `create` |
| `item` | Complete official item required for `update` |

## Steps

### 1. Prepare the Writer

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../agents/item-writer.md ../templates/authoring-context.md ../templates/item-understanding.md ../templates/item.md
```

Build the `authoring-context` from `intention` and, for `update`, the official
item's title and body. Apply the `item-writer` profile to that context. Record
`to_spec: accepted` only when the activation request explicitly asks for a
specification format.

### 2. Qualify the Need

When the activation request explicitly asks for immediate drafting, or the
change is purely mechanical, go to Step 3. Otherwise ask `item-writer` to
qualify the context. Follow its returned phase:

- For a focused question, collect one answer or source, update the context,
  and repeat this step.
- For a `to-spec` suggestion, present the reason and ask with
  `../templates/select-option.md`:

  ```text
  question: Do you want to use the suggested specification format?
  options:
  - Use specification format
  - Continue without specification format
  ```

  Record `to_spec: accepted` or `to_spec: declined`, then repeat this step.
- For an understanding summary, present it and continue to Step 3. Use it as
  the current intention while retaining established facts and open questions.

If the user leaves a blocking question unanswered, ask whether to preserve it
as an open question. Honor an active Skill's terminal-turn rule.

### 3. Draft and Present

Ask `item-writer` to return exactly one proposed item following
`../templates/item.md`. Present its title and free-form Markdown body as:

```markdown
### <item title>

<free-form Markdown body>
```

Preserve the body's Markdown. Put the writer's review notes after the preview.
Keep Skill announcements outside the preview.

### 4. Save or Adjust

Ask with `../templates/select-option.md`:

```text
question: What do you want to do with this item?
options:
- Save item
- Adjust item
```

On `Adjust item`, give the writer `current_proposal` and `last_adjustment`.
If it returns `qualification required`, update the intention with the
adjustment and reason, clear those two fields, and return to Step 2. Otherwise
present the revision using the complete preview when the title, structure, or
several sections change, or when the user asks for it. For a localized change,
show only content changes under the applicable **Added**, **Modified**, and
**Removed** labels. Repeat this step with the current proposal.

Continue only after the user explicitly selects `Save item`. If that choice
is unavailable, stop without mutation.

### 5. Save and Label

Run from this file's directory with the confirmed title and Markdown body.
For `create`, pass the selected destination:

```sh
node ../commands/save-item.ts <<'JSON'
{"mode":"create","title":"<confirmed title>","body":"<confirmed Markdown body>","destination":<selected destination JSON>}
JSON
```

For `update`, pass the official item ID:

```sh
node ../commands/save-item.ts <<'JSON'
{"mode":"update","title":"<confirmed title>","body":"<confirmed Markdown body>","item_id":"<official item ID>"}
JSON
```

On failure, report `stage` and `reason`, then stop without reporting a
successful save. On `saved`, run:

```sh
node ../commands/apply-item-label.ts <<'JSON'
{"item_id":"<saved item ID>","label":"agent-shaped"}
JSON
```

Report the observed save and label results using the contract below. A label
failure does not erase a successful save.

## Final Result Contract

Use this block after a successful save:

```markdown
## <saved item title, or Write result unavailable>

[Open in <provider display name> ↗](<saved or carried item URL>)

- **Status:** <observed provider status, or Unavailable>
- **Label:** <agent-shaped applied, or agent-shaped not applied with reason>
```

Omit the link when the URL is unavailable.
