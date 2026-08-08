# Work Confirm Branch

## Entry Condition

Run with:

- `plan`: authoritative selected or supplied plan;
- `work_mode`: `new` or `resumed`;
- `item`: complete official item context, when available.

---

## Steps

### 1. Require the Plan Contract

Require the authoritative plan to contain its existing `planId`, name,
Objective, Expected Outcome, todos with valid states, and global Validation.
Treat its todo states as authoritative.

### 2. Resolve Initialization

For `new`, follow `./work-initialize.md` with the authoritative plan and
optional official item. Keep the complete created request record returned by
that branch in the current execution context.

For `resumed`, trust that the current branch is the correct work branch and
that its draft request already exists. Do not:

- switch or create a branch;
- search for, read, recover, or recreate the request;
- create another initialization commit;
- push for initialization;
- add another item backlink.

Continue without a request record. Do not persist execution metadata in the
plan.

### 3. Execute the Plan

Follow `./work-execute.md` with:

```text
plan: authoritative plan
item: complete official item context, when available
request: created request record, when available
```
