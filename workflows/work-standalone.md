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
   eligibility_criteria:
     status: open
   fields: [labels, comments, request_backlinks]
   ```

3. Require the resolved item to contain `agent-planned`.

### 2. Resolve Work Mode

Set `work_mode` to `resumed` when the official item contains a `Draft PR:` or
`Draft MR:` backlink. Otherwise, set it to `new`.

### 3. Resolve the Delivery Context

For `resumed`:

1. Select the plan reference from `Agent-Workflows-Plan:` in the backlink
   comment.
2. Read the referenced local plan. Stop when the plan reference or local file
   is missing.

For `new`:

1. Run `../commands/read-item-plan.md` for the resolved item.
2. Write the returned `plan_content` unchanged to the local `../plans/`
   location defined by `../templates/plan.md`, using its filename rules.

### 4. Establish the Plan and Item Association

Apply the standalone association rule in `../templates/delivery-context.md` to
the resolved local plan and official item. For `resumed`, use the complete
backlink comment already read with the item. For `new`, treat the unchanged
plan content read from that same official item as association evidence. Also
check every Ticket reference present in the plan and stop on a contradiction.

### 5. Create the Delivery Context

Create `../templates/delivery-context.md` with the local plan path and complete
official item context, including any backlinks for `/ready` to resolve the
exact request.

### 6. Follow Shared Execution

Follow `./work-confirm.md` with:

```text
plan: selected plan
item: selected complete official item context
delivery_context: initialized delivery context
work_mode: resolved work mode
```
