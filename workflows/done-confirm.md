# Done Confirm Branch

## Entry Condition

Run with one `completion_context` following `../templates/done-context.md` and
`entry_mode: caller` or `standalone` set by `/done`.

---

## Steps

### 1. Validate Context

Require every non-optional field, then set `item` and `request` to the packet's
two sections. Require an exact non-draft request whose state is `open` or
`merged`, with a head SHA and normalized merge status. Fail incomplete context;
do not recover, resolve, or reread the request before preflight. Require a valid
`entry_mode`.

### 2. Prepare and Confirm

Run `../commands/transition-item-status.md` with:

```text
provider: item.provider
item_id: item.item_id
target_status: done
mode: resolve
```

On failed or ambiguous resolution, present `../templates/done-result.md` with
the item reason and stop.

For an open request, require a head SHA and `merge_status: mergeable`, then run
`../commands/merge-request.md` with:

```text
provider: request.provider
repository: request.repository
request_id: request.request_id
merge_method: squash
mode: resolve
```

On blocked, unknown, or unsupported merge eligibility, present
`../templates/done-result.md` with `Item: not attempted` and stop.

For a merged request, omit the merge. When the item is already done, present
`../templates/done-result.md` and stop without confirmation.

Present `../templates/done-preflight.md`, then ask once through
`../templates/select-option.md`:

```text
question: Complete this request and its item?
options:
- Confirm completion
- Stop without changes
```

On `Stop without changes`, stop without mutation.

### 3. Guard and Merge

Skip this step when the request was already merged.

Read the exact request once with `../commands/read-request.md` and:

```text
provider: request.provider
repository: request.repository
request_id: request.request_id
fields: delivery_state
```

Require the previewed request identity, branches, open non-draft state, head
SHA, and `merge_status: mergeable`. Discard the confirmation on any change.
When the head SHA changed in `caller` mode, stop and require a new `/inspect`.
Otherwise replace only returned request fields and return to Step 1.

Run `../commands/merge-request.md` with the same provider, repository, request
ID, `merge_method: squash`, and `mode: apply`.

Continue only on `merged`. Otherwise present `../templates/done-result.md` with
the observed request result and `Item: not attempted`. For `failed`, identify
the exact request operation still required; for `unobserved`, require observing
the request state before any rerun or item transition. Then stop.

### 4. Complete the Item

Unless already done, run `../commands/transition-item-status.md` with:

```text
provider: item.provider
item_id: item.item_id
target_status: done
mode: apply
resolved_target_status: exact confirmed target
```

Keep the best-effort result. Never retry or roll back an observed merge.

### 5. Report

Present `../templates/done-result.md`. After a partial result, identify only
the item transition as remaining. Stop without invoking another workflow.
