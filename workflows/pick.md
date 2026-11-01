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

When no item is supplied, ask for an item ID, native URL, title, or search
phrase before resolving it.

---

## Steps

### 1. Resolve the Item

Run from this file's directory. For an ID or native URL:

```sh
node ../commands/resolve-existing-item.ts --with-relations "<item>"
```

For a title or search phrase:

```sh
node ../commands/resolve-existing-item.ts --with-relations --query "<item>"
```

On `not_found`, ask for a better reference or search phrase and repeat. On
`ambiguous`, ask with `../templates/select-option.md` using each candidate's
title, status, and destination as its label and `item_id` as its value. Rerun
the command with the selected ID as the positional `item`. On failure, report
`stage` and `reason`, then stop. Use only the final `resolved` provider and
item as official context.

### 2. Check Eligibility

Pass the `resolved` result's complete official item to the eligibility command:

```sh
node ../commands/classify-pick-item.ts <<'JSON'
<resolved item JSON>
JSON
```

On failure, report `stage` and `reason`, then stop.

On `ineligible`, identify the item and report its observed status or reason,
then stop. On `already_planned`, identify the item and report that its plan is
available for `/work`, then stop. Only `eligible` continues.

### 3. Summarize and Plan

Present with `../templates/ticket-summary.md`:

```text
item: complete official item context
```

Follow `./plan.md` with:

```text
entry_mode: workflow
provider: resolved item provider
item: complete official item context
```

On an approved plan, continue to Step 4 with the complete official item
context returned by `/plan`.

On `needs-refinement`, report the exact findings and that no plan was created.
Ask with `../templates/select-option.md`:

```text
question: Do you want to refine this item?
options:
- Refine item
- Stop without changes
```

On `Stop without changes`, stop. On `Refine item`, follow `./refine.md` with:

```text
provider: resolved item provider
parent_item: unchanged complete official item context
needs_refinement_findings: exact findings returned by /plan
```

Then stop `/pick`.

### 4. Continue with Work

Follow `./work.md` with:

```text
plan: approved plan
item: complete official item context returned by /plan
```
