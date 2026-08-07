# Decomposition Confirmation

Use this template after presenting a complete decomposition preview and before
creating any provider-backed child item.

## Format

Ask the user using `./select-option.md` with:

```text
question: What do you want to do with this decomposition?
options:
- Confirm and create all child items
- Adjust the decomposition
- Cancel without changes
```

When the user selects `Adjust the decomposition`, ask what should change and
return the requested adjustments to the caller.

## Rules

- Treat `Confirm and create all child items` as approval of the complete
  decomposition, including every child title, body, and blocking relationship
  shown in the latest preview.
- Do not support partial confirmation or create only a subset of children.
- Do not create or update provider items before
  `Confirm and create all child items`.
- After an adjustment, require a new complete preview and confirmation.
- Treat `Cancel without changes` as a terminal decision that authorizes no
  provider mutation.
