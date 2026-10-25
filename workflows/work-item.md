# Work Item Branch

## Input


| Input              | Requirement            |
| ------------------ | ---------------------- |
| `work_mode`        | Required               |
| `plan`             | Required for `new`     |
| `item`             | Required for `new`     |
| `delivery-context` | Required for `resumed` |


---

## Steps

### 1. Follow the Work Mode

Follow exactly one case according to `work_mode`.

#### `new`

Use the plan's project-relative path. On failure, stop and report the returned
stage, reason, and completed identities. On success, replace the status in the
carried item context with `resulting_status`, then create or update the
`Delivery Context` with the plan path, updated item, `branch`, and `request`.

Run from this file's directory:

```sh
node ../commands/init-work.ts "<item ID>" "<plan name>" "<plan objective>" "<plan path>"
```



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
   Apply the transition with the same command:
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
