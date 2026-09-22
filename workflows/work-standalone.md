# Work Standalone Branch

## Steps

### 1. Initialize the Delivery Context

Follow `./delivery-context-standalone.md` and keep its plan, item, and delivery
context.

### 2. Resolve Work Mode

Set `work_mode` to `resumed` when the user explicitly asks to resume or the
selected plan contains an `in_progress` or `completed` todo. Otherwise, set it
to `new`.

Do not infer or update todo states from Git history or local changes.

### 3. Follow Shared Execution

After plan selection, execution is autonomous.

Follow `./work-confirm.md` with:

```text
plan: selected plan
item: selected complete official item context
delivery_context: initialized delivery context
work_mode: resolved work mode
```
