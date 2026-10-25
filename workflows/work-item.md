# Work Item Branch

## Entry Condition

Run with:

- `plan`: authoritative selected or supplied plan;
- `work_mode`: `new` or `resumed`;
- `item`: complete official item context.

---

## Steps

### 1. Keep the Plan and Item Authority

Preserve the supplied or selected plan and complete official item context
unchanged. Do not rediscover, rewrite, or approve the plan or reread the item.
Treat the plan's project-relative path as its canonical reference and its todo
states as authoritative.

Create or preserve a `Delivery Context`. Keep the canonical plan path as its
only plan authority.

### 2. Resolve Initialization

For `new`, follow `./work-initialize.md` with the authoritative plan and item.
Keep the updated official item and complete created request record returned by
that branch with its exact branch identity in the delivery context.

For `resumed`:

1. Resolve the push remote's provider and repository with
   `../commands/resolve-version-provider.md` and
   `../commands/resolve-version-repository.md`. Run
   `../commands/resolve-request.md` with the carried request ID or the item's
   delivery backlink and any carried source branch.
2. Run `git switch --no-guess <source_branch>` with the returned branch as a
   separate process argument. Preserve local changes; stop on a failed switch
   or an unclean worktree or index before changing files.
3. Apply only Step 1 of `./work-initialize.md` to move the item to `in progress`.
   Preserve the existing plan, branch, and request in the delivery context.

### 3. Execute the Plan

Follow `./work-execute.md` with:

```text
plan: authoritative plan
item: complete official item context
request: created request record, when available
delivery_context: current autonomous delivery context
```
