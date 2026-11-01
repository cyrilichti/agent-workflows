# Write Update

## Input

| Input | Description |
| --- | --- |
| `intention` | Initial revision request when present. |
| `item` | Required item ID, native URL, title, or search phrase. |

## Steps

### 1. Resolve the Item

Run from this file's directory. For an ID or native URL:

```sh
node ../commands/resolve-existing-item.ts "<item>"
```

For a title or search phrase:

```sh
node ../commands/resolve-existing-item.ts --query "<item>"
```

On `not_found`, ask for a better reference or search phrase and repeat. On
`ambiguous`, ask with `../templates/select-option.md` using each candidate's
title, status, and destination as its label and `item_id` as its value. Rerun
the command with the selected ID as the positional `item`. On failure, report
`stage` and `reason`, then stop. Use only the final `resolved` item as official
context.
Identify it to the user by title, status, and link when available.

### 2. Collect the Revision

Reuse `intention` when it describes what to change and in which direction.
Otherwise ask only for the missing revision context.

### 3. Author the Item

Follow `./write-execute.md` with `mode: update`, the returned `provider` and
official `item`, and the revision as `intention`.
