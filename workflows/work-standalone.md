# Work Standalone Branch

## Steps

### 1. Resolve the Official Item

1. Run `../commands/resolve-item-provider.md` with:

   ```text
   context: item
   ```

2. Run `../commands/resolve-existing-item.md` with any supplied item reference
   or title query and:

   ```text
   provider: resolved item provider
   candidate_criteria:
     status: open
     label: agent-planned
   fields: [labels, comments, request_backlinks]
   ```

3. Require the resolved item to contain `agent-planned`.

### 2. Resolve Work Mode

Set `work_mode` to `resumed` when the official item contains a `Draft PR:` or
`Draft MR:` backlink. Otherwise, set it to `new`.

### 3. Resolve the Delivery Context

For `resumed`, read the local plan referenced by `Agent-Workflows-Plan:` in
the backlink comment and preserve its current content and todo states. When
backlinks reference different plans, ask which referenced plan to use. Stop
when the plan reference or local file is missing. Keep the item backlinks in
the delivery context for `/ready` to resolve the exact request.

For `new`, run `../commands/read-item-plan.md` for the resolved item and write
the returned `plan_content` unchanged to the local `../plans/` location defined
by `../templates/plan.md`, using its filename rules.

Create `../templates/delivery-context.md` with the local plan path and complete
official item context.

### 4. Follow Shared Execution

Follow `./work-confirm.md` with:

```text
plan: selected plan
item: selected complete official item context
delivery_context: initialized delivery context
work_mode: resolved work mode
```
