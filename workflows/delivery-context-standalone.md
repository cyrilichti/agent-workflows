# Delivery Context Standalone

## Purpose

Select the authoritative plan and official item for a standalone delivery
workflow.

## Steps

### 1. Select the Plan

Select at most the 10 newest `../plans/*.plan.md` files and ask using
`../templates/select-option.md`:

```text
question: Which plan do you want to use?
options:
- label: <readable plan name>
  value: <plan file path>
```

When none exists, report that no delivery plan is available and stop. Read the
selection without modifying it and require `../templates/plan.md`.

### 2. Resolve the Official Item

Resolve the configured item provider, then run
`../commands/resolve-existing-item.md` with any supplied item reference or title
query and:

```text
candidate_criteria:
  status: open
  label: agent-shaped
fields: request_backlinks
```

### 3. Return the Context

Return the selected plan, complete official item, and a new
`../templates/delivery-context.md` containing both.
