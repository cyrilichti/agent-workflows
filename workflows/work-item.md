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

Pass the plan path relative to the project.

Run from this file's directory:

```sh
node ../commands/work-new.ts "<item ID>" "<plan name>" "<plan objective>" "<plan path>"
```

If the command fails, report its `stage`, `reason`, and completed identities,
then stop. Otherwise, set the carried item's status to `resulting_status`,
then create or update `Delivery Context` with the plan path, item, `branch`,
and `request`.



#### `resumed`

Pass the item ID, `delivery-context.request.request_id`, and
`delivery-context.branch`. Stop if either context value is missing.

Run from this file's directory:

```sh
node ../commands/work-resume.ts "<item ID>" "<request ID>" "<branch>"
```

If the command fails, report its `stage`, `reason`, and completed identities,
then stop. Otherwise, set the carried item's status to `resulting_status` and
record the returned `branch` and `request` in `Delivery Context`.



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
