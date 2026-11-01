# Pick

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../goals/pick-complete.md
```

---

## Input

| Input | Description |
| --- | --- |
| `item` | Optional official item ID, native URL, title, or search phrase |

---

## Steps

### 1. Resolve the Item

When no `item` is supplied, follow `../commands/resolve-item-provider.md`,
then `../commands/retrieve-items.md` with `agent-shaped` as the exact label,
all display fields, a limit of 5, and `allow_empty: true`. Ask with
`../templates/select-option.md` using every returned candidate's title,
status, and destination plus `Search by title`. Use the selected candidate's
provider ID as `item`, or the supplied search phrase as a title query.

Run from this file's directory. For an ID or native URL:

```sh
node ../commands/resolve-pick-item.ts "<item>"
```

For a title or search phrase:

```sh
node ../commands/resolve-pick-item.ts --query "<item>"
```

On `not_found`, ask for a better reference or search phrase and repeat. On
`ambiguous`, ask with `../templates/select-option.md` using each candidate's
title, status, and destination as its label and `item_id` as its value; rerun
with the selected ID. On `failed`, report `stage` and `reason`, then stop.

On `ineligible`, identify the item and report its observed status or reason,
then stop. On `already_planned`, identify the item and report that its plan is
available for `/work`, then stop. Only `eligible` continues. Use its provider
and complete official item context for every downstream handoff.

### 2. Summarize and Plan

Present the item with `../templates/ticket-summary.md`, then follow
`./plan.md` with:

```text
entry_mode: workflow
provider: resolved item provider
item: complete official item context
```

On an approved plan, continue to Step 3 with the complete official item
context returned by `/plan`.

On `needs-refinement`, report the exact findings and ask with
`../templates/select-option.md`:

```text
question: Do you want to refine this item?
options:
- Refine item
- Stop without changes
```

On `Refine item`, follow `./refine.md` with the resolved provider, unchanged
complete official parent item, and exact `needs_refinement_findings`; then
stop `/pick`. On `Stop without changes`, stop.

### 3. Continue with Work

Follow `./work.md` with:

```text
plan: approved plan
item: complete official item context returned by /plan
```
