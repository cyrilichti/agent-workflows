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
eligibility_criteria:
  status: open
fields: [labels, comments, request_backlinks]
```

Require the resolved item to contain `agent-planned`.

### 3. Establish the Plan and Item Association

Apply the standalone association rule in `../templates/delivery-context.md` to
the selected plan and official item, using the complete comments returned by
the existing item read. Stop before delivery when the association is missing
or contradictory.

### 4. Return the Context

Return the selected plan, complete official item, and a new
`../templates/delivery-context.md` containing both.
