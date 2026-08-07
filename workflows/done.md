# Done

## Purpose

Finalize one exact pull request or merge request through the configured version
provider, then move its official item to the resolved next `done` state.

The workflow is explicitly invoked and stops after reporting the observed
request and item states.

---

## Entry Condition

Run after `./play-book.md` selects `done` or when the local `done` Skill is
explicitly invoked. Accept an exact official item ID when the caller supplies
one; otherwise let the user select an item awaiting completion.

---

## Steps

### 1. Resolve One Official Item

Resolve the configured item provider with
`../commands/resolve-item-provider.md` using `context: item`.

When an exact item ID was supplied, run `../commands/read-item.md` with that ID
and `fields: request_backlinks`.

Otherwise, run `../commands/resolve-item-status.md` with
`semantic_status: review`. When it returns criteria, run
`../commands/retrieve-items.md` with those exact criteria. When it returns
items, ask using `../templates/select-option.md` with:

```text
question: Which item do you want to complete?
options:
- label: <title, status, and destination when available>
  value: <provider item ID>
```

When discovery is unavailable or finds no item, ask for an exact item ID. Read
the selected item with
`fields: request_backlinks` and keep that read as the official item context.

### 2. Resolve the Exact Request

Resolve the version provider with `../commands/resolve-version-provider.md`.
Read the current Git push remote without fetching and resolve the repository
through `../commands/resolve-version-repository.md`.

Run `../commands/resolve-request.md` with:

```text
provider: resolved version provider
repository: resolved repository
request_backlinks: official item request backlinks
require_non_draft: true
allowed_states:
  - open
  - merged
```

When no unique backlink resolves the request, that command asks for the exact
pull-request number or merge-request IID. Never list, search for, or substitute
another request.

Read the exact request with `fields: delivery_state`.

### 3. Resolve the Remaining Operations

Run `../commands/transition-item-status.md` with:

```text
provider: resolved item provider
item_id: official item ID
target_status: done
mode: resolve
```

Stop before mutation when the next `done` state cannot be resolved uniquely.

For an open request, require `merge_status: mergeable` and a head SHA. Report
the provider's blocker and stop when the request is blocked or its eligibility
is unknown. Stop as unsupported when the configured version adapter exposes no
merge operation.

For a merged request, omit the merge from the remaining operations. When the
item is also already done, report the completed state and stop without asking
for confirmation.

### 4. Preview and Confirm

Present the exact request state, item transition, and remaining mutations using
`../templates/done-preflight.md`.

Ask once through `../templates/select-option.md`:

```text
question: Complete this request and its item?
options:
- Confirm completion
- Stop without changes
```

On `Stop without changes`, perform no mutation and stop.

### 5. Merge the Open Request

Skip this step when the request was already merged.

After confirmation, read the request again with `fields: delivery_state`.
Require the same open request, exact previewed head SHA, and
`merge_status: mergeable`. On any change, stop and require a new preview and
confirmation.

Run `../commands/merge-request.md` with the resolved provider, repository, and
request ID. Include a merge method only when the provider required the user to
select one.

Continue only when the normalized result is `merged`. For `blocked`,
`unsupported`, `failed`, or `unobserved`, report the request result and
`Item: not attempted` through `../templates/done-result.md`, then stop.

### 6. Complete the Official Item

When the item was not already done, run
`../commands/transition-item-status.md` with:

```text
provider: resolved item provider
item_id: official item ID
target_status: done
mode: apply
resolved_target_status: exact target shown in the confirmed preview
```

Record the best-effort result. Do not retry or roll back an observed merge when
the item transition fails.

### 7. Report and Stop

Present the observed request and item outcomes through
`../templates/done-result.md`. On a partial result, identify only the item
transition as the remaining action for an explicit rerun.

Stop without invoking another workflow.

---

## Safety

- Never mutate before the single explicit confirmation.
- Never merge a Draft, blocked, unknown, changed-head, or substituted request.
- Never transition the item before the request is observed as merged.
- Never retry automatically or roll back a successful merge.
- Never modify code, commits, branches, request content, reviews, or item
  fields other than the resolved state.
- Never deploy, release, tag, or invoke another workflow.

---

## Success Criteria

`/done` succeeds when the exact request is observed as merged, the official
item is transitioned or already in its resolved `done` state, every mutation
was explicitly confirmed, and the workflow reports the observed terminal state
without invoking another workflow.
