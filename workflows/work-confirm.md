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

For `resumed`:

1. Resolve the push remote's provider and repository with
   `../commands/resolve-version-provider.md` and
   `../commands/resolve-version-repository.md`. Run
   `../commands/resolve-request.md` with the carried request ID or the item's
   delivery backlink, any carried source branch, and `fields: delivery_state`.
2. Before changing files, require a clean worktree and index, including no
   untracked files. Validate the returned source branch as a non-default Git
   branch, then run `git switch --no-guess <source_branch>` with the branch as
   a separate process argument. Stop on a missing local branch or failed switch.
3. Require that branch to be current and clean, with an upstream in the same
   push repository and source branch. Stop if it is behind or diverged, or its
   upstream SHA differs from the request head SHA.
4. Apply only Step 1 of `./work-initialize.md` to move the item to `in progress`.
   Preserve the existing plan, branch, and request in the delivery context.

Do not create a branch, plan, request, initialization commit, or backlink;
do not stash, reset, clean, force-switch, fetch, pull, or create another worktree
for resumption. Do not persist Git or request metadata in the plan.

### 3. Execute the Plan

Follow `./work-execute.md` with:

```text
plan: authoritative plan
item: complete official item context
request: created request record, when available
delivery_context: current autonomous delivery context
```
