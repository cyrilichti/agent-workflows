# Work Standalone Branch

## Steps

### 1. Resolve Work Mode

Set `work_mode` to `resumed` only when the user explicitly asks to resume.

### 2. Resolve the Delivery Context

For `resumed`, follow `./delivery-context-standalone.md` and keep its plan,
item, and delivery context.

For `new`:

1. Resolve the configured item provider.
2. Run `../commands/resolve-existing-item.md` with any supplied item reference
   or title query and:

   ```text
   candidate_criteria:
     status: open
     label: agent-planned
   fields: labels
   ```

3. Require the exact `agent-planned` label on the official item.
4. Run `../commands/read-item-plan.md` for that item.
5. Write the returned `plan_content` unchanged to the local `../plans/`
   location defined by `../templates/plan.md`, using its filename rules.
6. Create `../templates/delivery-context.md` with the local plan path and
   complete official item context.

### 3. Follow Shared Execution

Follow `./work-confirm.md` with:

```text
plan: selected plan
item: selected complete official item context
delivery_context: initialized delivery context
work_mode: resolved work mode
```
