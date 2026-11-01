# Plan Standalone

## Input

| Input | Description |
| --- | --- |
| `intention` | Current request and conversation context |

## Steps

Use the intention directly when the objective, problem, and expected outcome
are known. Otherwise, from this file's directory, read only the files below
that are not already active:

```sh
cat ../agents/item-writer.md ../templates/item.md
```

Apply `item-writer` to the request, relevant conversation, and only references
identified by the user. Keep its one lightweight item as transient context:

```text
title: meaningful item title
body: free-form Markdown containing the objective, problem, and expected outcome
```

Follow `./plan-confirm.md` with the complete conversational or transient item
context as `task_context` and `entry_mode: standalone`.
