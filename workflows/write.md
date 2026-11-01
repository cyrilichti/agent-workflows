# Write

## Required Context

From this file's directory, read only the files below that are not already
active. Omit active paths from the `cat` command; skip it when none remain:

```sh
cat ../rules/default-language.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../goals/write-complete.md
```

---

## Input

| Input | Description |
| --- | --- |
| `intention` | Available request to create or reformulate one item. |

Infer `create` for a new item and `update` for an existing item when the
intention makes the mode clear. For a bare `/write` or a genuinely ambiguous
request, ask with `../templates/select-option.md`:

```text
question: What do you want to write?
options:
- Create a new item
- Reformulate an existing item
```

---

## Branch Routing

Select exactly one branch:

| Mode | Workflow |
| --- | --- |
| `create` | `./write-create.md` |
| `update` | `./write-update.md` |

Pass the initial intention when available. Read the selected workflow file
completely and follow it.
