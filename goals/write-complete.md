# Write Complete

## Outcome

Exactly one confirmed item has been saved through the configured item provider.

## Terminal Outcomes

- Complete: the saved item contains the confirmed title and Markdown body,
  `agent-shaped` is applied, and `../templates/write-result.md` presents the
  observed item and label result.
- Saved with label failure: the confirmed item is saved and the same result
  identifies why `agent-shaped` was not applied.
- Stopped: the item could not be saved and no successful save is reported.
