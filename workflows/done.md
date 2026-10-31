# Done

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../goals/done-complete.md
```

---

## Input

| Input | Description |
| --- | --- |
| `item` | Required item ID, native URL, title, or search phrase. |

Invoking `/done` authorizes the eligible completion without another
confirmation.

---

## Steps

### 1. Complete the Request and Item

Run from this file's directory. For an ID or native URL:

```sh
node ../commands/done.ts "<item>"
```

For a title or search phrase:

```sh
node ../commands/done.ts --query "<item>"
```

If the item is missing, ask for it before running the command.

### 2. Report

Use the observed command result and the format in `../goals/done-complete.md`.
On failure, include `stage` and `reason` when returned.
