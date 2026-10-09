# Done Confirm Branch

## Entry Condition

Run with one `completion_context` following `../templates/done-context.md` and
`entry_mode: caller` or `standalone` set by `/done`.

This branch owns completion sequencing, eligibility, confirmation, mutation
limits, and stop decisions. Commands own their provider operations and
normalized mutation results; the goal owns terminal outcomes; templates own
context and output formats.

---

## Steps

### 1. Validate Context

Validate the Done Context shape defined by `../templates/done-context.md` and a
valid `entry_mode`, then set `item` and `request` to the packet's two sections.
Fail invalid required identities or request data without switching entry mode
or resolving a substitute.

When the reusable item fields are absent or incomplete, run
`../commands/read-item.md` once with:

```text
provider: item.provider
item_id: item.item_id
fields:
  - labels
```

Replace the item section with the returned official identity, labels, current
status, and status destination. On a failed or incomplete read, present
`../templates/done-result.md` with the observed item reason and
`Request: not attempted`, then stop.

### 2. Prepare and Confirm

Require the complete current label set. When `agent-inspected` is absent,
report the item as waiting for that label and the request as not attempted,
then stop.

Run `../commands/transition-item-status.md` with:

```text
provider: item.provider
item_id: item.item_id
target_status: done
mode: resolve
official_item: item
```

Keep the returned `status_resolution`. On failed or ambiguous resolution,
present `../templates/done-result.md` and stop.

For an open request with any `merge_status` other than `mergeable`, present
`../templates/done-result.md` with the observed status, its blocker when
available, and `Item: not attempted`, then stop.

For an open request with `merge_status: mergeable`, run
`../commands/merge-request.md` with:

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
`../templates/done-result.md` with the observed status, its blocker when
available, and `Item: not attempted`, then stop.

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
status_resolution: complete resolution returned before confirmation
```

Replace the item's affected status fields with the mutation result.

### 5. Report

Present `../templates/done-result.md`. After an observed merge, only the item
transition may remain.

---

## Safety

- After confirmation, mutate only the exact request and its item.
- Never modify work or request content, deploy, release, tag, retry, roll back,
  or invoke another workflow.
