# Ready Standalone Branch

## Steps

### 1. Select the Plan

Select only files under `../plans/` whose names end with `.plan.md`. Sort them
by modification time from newest to oldest, keep at most the first 10, and ask
using `../templates/select-option.md` with:

```text
question: Which plan do you want to prepare for review?
options:
- label: <readable plan name>
  value: <plan file path>
```

When no matching plan exists, report that no ready plan is available and stop.
Read the selected plan without modifying it.

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

Use the final read result as the complete official item context.

### 3. Create the Delivery Context

Create `../templates/delivery-context.md` with the selected plan and item.
Follow `./ready-confirm.md`; it resolves the exact branch and request, asking
only for the request number or IID when the official item has no unique
backlink. Continue autonomously after these initial selections.

```text
plan: selected plan
item: selected complete official item context
delivery_context: new delivery context
```
