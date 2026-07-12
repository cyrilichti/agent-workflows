# Experiment: Validate template usage and selection UI

**Outcome:** success · **Date:** 2026-07-02 · **Playbook:** Review · **Agent:** Codex

**Tickets:** [Add AI templates](https://app.clickup.com/t/869dyqncr)
**Deliverable:** `.agents/templates/`

## Results

| Area              | Status | Notes                                      |
| ----------------- | ------ | ------------------------------------------ |
| Template usage    | ✅     | workflows now reference reusable templates |
| Selection pattern | ✅     | `select-option` captures native UI intent  |
| Cursor behavior   | ✅     | triggers a dedicated UI for selections     |
| Codex behavior    | ✅     | uses the text fallback for selections      |

## Learnings

* Templates are effectively used to move recurring output shapes out of workflows.
* Cursor exposes a specific selection UI when a workflow asks for a choice.
* Codex does not expose the same selection UI here, so the template fallback remains necessary.
