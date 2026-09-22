# Done Confirm Branch

## Entry Condition

Run with one `completion_context` following `../templates/done-context.md` and
`entry_mode: caller` or `standalone` set by `/done`.

---

## Steps

### 1. Validate Context

Require a complete Done Context and a valid `entry_mode`, then set `item` and
`request` to the packet's two sections. Fail invalid context without switching
entry mode or resolving a substitute.

### 2. Prepare and Confirm

Run `../commands/read-item.md` with:

```text
provider: item.provider
item_id: item.item_id
fields:
  - labels
```

Require the complete current label set. On a failed or incomplete read,
present `../templates/done-result.md` with the observed item reason and
`Request: not attempted`, then stop. When `agent-inspected` is absent, report
the item as waiting for that label and the request as not attempted, then stop.

Run `../commands/transition-item-status.md` with:

```text
provider: item.provider
item_id: item.item_id
target_status: done
mode: resolve
```

On failed or ambiguous resolution, present `../templates/done-result.md` and
stop.

When an open request is not mergeable, present
`../templates/done-result.md` with its blocker and `Item: not attempted`, then
stop. Otherwise run `../commands/merge-request.md` with:

```text
provider: request.provider
repository: request.repository
request_id: request.request_id
merge_method: squash
mode: resolve
```

On any result other than `supported`, present `../templates/done-result.md`
with `Item: not attempted` and stop.

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

### 3. Recheck and Merge

Skip this step when the request was already merged.

Read the exact request once with `../commands/read-request.md` and:

```text
provider: request.provider
repository: request.repository
request_id: request.request_id
fields: delivery_state
```

Require the confirmed identity, branches, open non-draft state, and head SHA.
On any change, discard the confirmation. In `caller` mode, stop with the
observed stale-context result. In `standalone` mode, replace the request fields
and return to Step 1. When only mergeability changed, present
`../templates/done-result.md` with the observed blocker and
`Item: not attempted`, then stop.

Run `../commands/merge-request.md` with the same provider, repository, request
ID, `merge_method: squash`, and `mode: apply`.

Continue only on `merged`. Otherwise present `../templates/done-result.md` with
the observed request result and `Item: not attempted`, then stop.

### 4. Complete the Item

Unless already done, run `../commands/transition-item-status.md` with:

```text
provider: item.provider
item_id: item.item_id
target_status: done
mode: apply
resolved_target_status: exact confirmed target
```

### 5. Report

Present `../templates/done-result.md`. After an observed merge, only the item
transition may remain.
