# Work Item Branch

## Input

| Input | Value |
| --- | --- |
| `plan` | Authoritative selected or supplied plan |
| `item` | Complete official item context |
| `work_mode` | `new` or `resumed` |
| `delivery-context` | Existing context, when available |

---

## Steps

### 1. Follow the Work Mode

Follow exactly one case according to `work_mode`.

#### `new`

1. Run `../commands/resolve-item-provider.md`. Resolve the exact `in progress`
   target with `../commands/transition-item-status.md`:

   ```text
   provider: resolved item provider
   item_id: official item ID
   target_status: in progress
   mode: resolve
   official_item: complete official item context
   ```

   Apply the transition with the same command:

   ```text
   provider: resolved item provider
   item_id: official item ID
   target_status: in progress
   mode: apply
   resolved_target_status: exact status returned by resolution
   status_resolution: complete status resolution returned by resolution
   ```

   Stop before preparing the base branch when the transition fails. Replace the
   status in the official item context with the returned resulting status.
2. Use the current checkout and resolve the repository's default branch. Run
   `git switch <default_branch>`, then `git pull --ff-only` on that branch.
   Perform the switch automatically; do not ask the user to switch or stop
   merely because another branch is current or local changes are present.
   Preserve local changes and let Git reject an unsafe switch or pull.

   Stop on a failed switch or pull with its observed error. After both succeed,
   require a clean worktree and index before creating the work branch. If local
   changes remain, report them and stop without discarding them.
3. Format the branch name with `../templates/branch-name.md` using:

   ```text
   plan_name: exact plan name
   plan_objective: exact plan Objective
   item_type: official item type, when available
   ```

   Create and switch to the branch, create one empty initialization commit named
   from the plan, then push to the current push remote.
4. Run `../commands/resolve-version-provider.md`, then
   `../commands/resolve-version-repository.md` with:

   ```text
   provider: resolved version provider
   push_remote: current push remote
   ```

   Format the title with `../templates/request-title.md` using:

   ```text
   plan_name: exact plan name
   item_id: official item ID
   ```

   Run `../commands/create-request.md` with:

   ```text
   provider: resolved version provider
   repository: repository derived from the push remote
   source_branch: created work branch
   target_branch: default branch used for initialization
   title: formatted draft request title
   ```

   Keep the complete created request record in the current execution context.
5. Run `../commands/link-request-to-item.md` with:

   ```text
   provider: item provider from the official item context
   item_id: official item ID
   request_kind: created request kind
   request_url: created request URL
   plan_reference: project-relative authoritative plan file path
   ```

   Create or update the `Delivery Context` with the plan's project-relative
   path, updated official item, created branch, and complete request record.

#### `resumed`

1. Resolve the push remote's provider and repository with
   `../commands/resolve-version-provider.md` and
   `../commands/resolve-version-repository.md`. Run
   `../commands/resolve-request.md` with the carried request ID or the item's
   delivery backlink and any carried source branch.
2. Run `git switch --no-guess <source_branch>` with the returned branch as a
   separate process argument. Preserve local changes; stop on a failed switch
   or an unclean worktree or index before changing files.
3. Run `../commands/resolve-item-provider.md`. Resolve the exact `in progress`
   target with `../commands/transition-item-status.md`:

   ```text
   provider: resolved item provider
   item_id: official item ID
   target_status: in progress
   mode: resolve
   official_item: complete official item context
   ```

   Apply the transition with the same command:

   ```text
   provider: resolved item provider
   item_id: official item ID
   target_status: in progress
   mode: apply
   resolved_target_status: exact status returned by resolution
   status_resolution: complete status resolution returned by resolution
   ```

   Stop when the transition fails. Replace the status in the official item
   context with the returned resulting status. Preserve the existing plan,
   branch, and request in the delivery context.

### 2. Execute the Plan

Follow `./work-execute.md` with:

```text
plan: authoritative plan
item: complete official item context
request: created request record, when available
delivery_context: current autonomous delivery context
```

---

## Safety

During `new` initialization:

- Do not create or select another worktree, including as a fallback for local
  changes, a checked-out base branch, or a failed switch or pull.
- Do not stash, reset, clean, or force a branch switch.
- Do not fetch separately, merge, rebase, or use another pull mode.
- Do not run a general repository, provider, MCP capability, or backlink
  preflight.
- Link only the newly created request.
- Do not persist Git, provider, or request metadata in the plan.
