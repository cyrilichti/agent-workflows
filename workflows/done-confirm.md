# Done Confirm Branch

## Entry Condition

Run with one complete `completion_context` following
`../templates/done-context.md`.

---

## Steps

### 1. Require the Completion Context

Require every non-optional Done Context field. Preserve the supplied item and
request completion fields unchanged. Do not resolve, search, select, or reread
them before the preview.

Require `completion_context.request` to be open or merged and non-draft, with
an exact head SHA and normalized merge status. Fail incomplete caller context
instead of recovering it.

### 2. Resolve the Remaining Operations

Run `../commands/transition-item-status.md` with:

```text
provider: completion_context.item.provider
item_id: completion_context.item.id
target_status: done
mode: resolve
```

Stop before mutation when the next `done` state cannot be resolved uniquely.

For an open request, require `merge_status: mergeable` and a head SHA. Report
the provider's blocker and stop when the request is blocked or its eligibility
is unknown. Stop as unsupported when the configured version adapter exposes no
merge operation.

For a merged request, omit the merge from the remaining operations. When the
item is also already done, present `../templates/done-result.md` with the
observed completed state and finish according to `../goals/done-complete.md`
without asking for confirmation.

### 3. Preview and Confirm

Present the exact request state, item transition, and remaining mutations using
`../templates/done-preflight.md`.

Ask once through `../templates/select-option.md`:

```text
question: Complete this request and its item?
options:
- Confirm completion
- Stop without changes
```

On `Stop without changes`, finish according to `../goals/done-complete.md`
without mutation.

### 4. Merge the Open Request

Skip this step when the request was already merged.

After confirmation, run `../commands/read-request.md` with:

```text
provider: completion_context.request.provider
repository: completion_context.request.repository
request_id: completion_context.request.id
fields: delivery_state
```

Require the same open request, exact previewed head SHA, and
`merge_status: mergeable`. On any change, stop and require a new preview and
confirmation.

Run `../commands/merge-request.md` with:

```text
provider: completion_context.request.provider
repository: completion_context.request.repository
request_id: completion_context.request.id
merge_method: squash
```

Continue only when the normalized result is `merged`. For `blocked`,
`unsupported`, `failed`, or `unobserved`, present
`../templates/done-result.md` with the request result and
`Item: not attempted`, then stop.

### 5. Complete the Official Item

When the item was not already done, run
`../commands/transition-item-status.md` with:

```text
provider: completion_context.item.provider
item_id: completion_context.item.id
target_status: done
mode: apply
resolved_target_status: exact target shown in the confirmed preview
```

Record the best-effort result. Do not retry or roll back an observed merge when
the item transition fails.

### 6. Report and Stop

Present the observed request and item outcomes through
`../templates/done-result.md`. On a partial result, identify only the item
transition as the remaining action for an explicit rerun.

Finish according to `../goals/done-complete.md` without invoking another
workflow.
