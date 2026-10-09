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
selection without modifying it.

### 2. Resolve the Official Item

Run `../commands/resolve-item-provider.md`.

Then run `../commands/resolve-existing-item.md` with any supplied item reference
or title query and:

```text
provider: resolved item provider
candidate_criteria:
  status: open
  label: agent-planned
fields: [labels, comments, request_backlinks]
```

Require the resolved item's `closed` field to be `false` and its labels to
contain `agent-planned`. Otherwise, identify the item, report the unmet
condition, and stop before creating the delivery context.

### 3. Establish the Plan and Item Association

Establish the selected plan's association with the official item from at least
one of:

- an `Agent-Workflows-Plan:` comment matching the canonical local plan path;
- the plan's exact Ticket ID and URL both matching the official item;
- unchanged plan content read from that same item's approved-plan comment
  during this run.

Use the comments and plan content already read in this run. Check every
available plan backlink and Ticket reference for a contradiction with the
selected pair. Stop before creating the delivery context when the association
is missing or contradictory.

### 4. Return the Context

Return the selected plan, complete official item, and a new
`../templates/delivery-context.md` containing both.
