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

Run from this file's directory with the selected project-relative plan path:

```sh
node ../commands/establish-plan-item-association.ts "<plan path>" <<'JSON'
{ "item": <complete official item>, "approved_content": <unchanged approved plan content, when read in this run> }
JSON
```

Use the comments already read. Omit `approved_content` when unavailable.
On failure, report `reason` and stop before creating the delivery context.

### 4. Return the Context

Return the selected plan, complete official item, and a new
`../templates/delivery-context.md` containing both.
