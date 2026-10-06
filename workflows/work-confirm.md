# Work Confirm Branch

## Entry Condition

Run with:

- `plan`: authoritative selected or supplied plan;
- `work_mode`: `new` or `resumed`;
- `item`: complete official item context.

---

## Steps

### 1. Keep the Plan Authority

Use the supplied or selected local plan unchanged. Treat its project-relative
path as its canonical reference and its todo states as authoritative.

Create or preserve `../templates/delivery-context.md`. Keep the canonical plan
path as its only plan authority.

### 2. Start the Item

Run this step only when `work_mode` is `new`. For `resumed`, continue with
step 3, preserving the supplied item context.

Run `../commands/resolve-item-provider.md` with:

```text
context: item
```

Then run `../commands/transition-item-status.md` with:

```text
provider: resolved item provider
item_id: official item ID
target_status: in progress
```

Stop before initialization when the transition fails.
Replace the status in the official item context with the returned resulting
status and preserve that updated item in the delivery context.

### 3. Resolve Initialization

For `new`, follow `./work-initialize.md` with the authoritative plan and item.
Keep the complete created request record returned by that branch with its exact
branch identity in the delivery context.

For `resumed`, trust that the current branch is the correct work branch and
that its draft request already exists. Do not:

- switch or create a branch;
- search for, read, recover, or recreate the request;
- create another initialization commit;
- push for initialization;
- add another item backlink.

Continue with caller identities when supplied. A standalone resumed entry may
resolve the exact request once when `/ready` needs it, but never searches for a
substitute. Do not persist Git, provider, or request metadata in the plan.

### 4. Execute the Plan

Follow `./work-execute.md` with:

```text
plan: authoritative plan
item: complete official item context
request: created request record, when available
delivery_context: current autonomous delivery context
```
