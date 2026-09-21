# Inspect Standalone Branch

## Steps

### 1. Select the Plan

Select only files under `../plans/` whose names end with `.plan.md`. Sort them
by modification time from newest to oldest, keep at most the first 10, and ask
using `../templates/select-option.md` with:

```text
question: Which plan belongs to the request you want to inspect?
options:
- label: <readable plan name>
  value: <plan file path>
```

When no matching plan exists, report that standalone inspection requires the
ignored plan file and stop. Read the selected plan without modifying it and
require it to satisfy the plan contract.

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

### 3. Resolve the Request and Create the Delivery Context

Resolve the configured version provider and repository from the current Git
push remote. Run `../commands/resolve-request.md` with the official item
backlinks, any supplied request ID, and `require_non_draft: true`.

Create `../templates/delivery-context.md` from the selected plan, item, current
branch, and exact request, then follow `./inspect-execute.md`. Continue
autonomously after these initial selections.
