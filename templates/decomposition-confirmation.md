# Decomposition Confirmation

Use this template after presenting a complete decomposition preview and before
creating any provider-backed child item.

## Format

Ask the user using `./select-option.md` with:

```text
question: What do you want to do with this decomposition?
options:
- label: Confirm and create all child items
  value: confirm
- label: Adjust the decomposition
  value: adjust
- label: Cancel without changes
  value: cancel
```

When the user selects `adjust`, ask what should change and return the requested
adjustments to the caller.

## Rules

- Treat `confirm` as approval of the complete decomposition, including every
  child title, body, and blocking relationship shown in the latest preview.
- Do not support partial confirmation or create only a subset of children.
- Do not create or update provider items before `confirm`.
- After an adjustment, require a new complete preview and confirmation.
- Treat `cancel` as a terminal decision that authorizes no provider mutation.
- Localize the question and labels according to
  `../rules/default-language.md`; preserve the option values unchanged.
