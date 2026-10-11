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

### 2. Resolve Initialization

For `new`, follow `./work-initialize.md` with the authoritative plan and item.
Keep the updated official item and complete created request record returned by
that branch with its exact branch identity in the delivery context.

For `resumed`, follow `./work-resume.md` before any plan or implementation
change. Preserve its exact branch and request in the delivery context.

### 3. Execute the Plan

Follow `./work-execute.md` with:

```text
plan: authoritative plan
item: complete official item context
request: created request record, when available
delivery_context: current autonomous delivery context
```
