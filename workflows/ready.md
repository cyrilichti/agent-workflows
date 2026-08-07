# Ready

## Purpose

Verify that completed development matches its plan, obtain one explicit
approval, push the current branch, and promote its request to human review.

The workflow stops after promotion. It does not run smoke tests, perform an
independent code review, or invoke `/review`.

---

## Entry Condition

Run this workflow in one of these modes:

- **Caller mode**: receive the authoritative plan, optional official item
  context, and the created request ID when the caller has it.
- **Standalone mode**: select a plan and collect the request ID before the
  preflight.

---

## Steps

### 1. Select the Plan

In caller mode, use the supplied plan and preserve the optional official item
and request ID.

In standalone mode, select only files under `../plans/` whose names end with
`.plan.md`. Sort them by modification time from newest to oldest, keep at most
the first 10, and ask using `../templates/select-option.md` with:

```text
question: Which plan do you want to prepare for review?
options:
- label: <readable plan name>
  value: <plan file path>
```

When no plan exists, report that no ready plan is available and stop.

Read the plan and require its existing `planId`, Objective, Expected Outcome,
todos, and global Validation. Do not modify the plan.

### 2. Require Completed Work

Require every todo to be `completed` or `cancelled`. When a todo is pending or
in progress, return its exact state as an actionable `/work` finding and stop.

Require a clean worktree. Treat local changes as unfinished work, report them
to `/work`, and stop without staging, committing, or discarding anything.

### 3. Resolve the Branch and Request

Read the current branch, exact local `HEAD` SHA, configured upstream, upstream
branch ref, and ahead/behind counts without fetching.

Require:

- a named non-default work branch;
- an upstream for that branch;
- no behind or diverged state;
- a push remote and remote branch that correspond to the upstream.

Ahead commits are expected and will be pushed only after confirmation. Keep
missing, inaccessible, or unsafe Git configuration in `/ready` with an exact
manual action.

Resolve the configured version provider with
`../commands/resolve-version-provider.md` and the repository with
`../commands/resolve-version-repository.md` from the push remote.

Run `../commands/resolve-request.md` with:

```text
provider: resolved version provider
repository: repository derived from the push remote
source_branch: current branch
request_id: caller request ID, when available
```

If the ID is absent, that command asks the user for the pull-request number or
merge-request IID. Keep provider, authentication, access, and request failures
in `/ready`; do not substitute another request.

### 4. Rerun Global Validation

Record the exact `planId` and `HEAD`, then run every applicable check in the
plan's global Validation against that repository state. Use inspection for a
validation item that is explicitly manual. Do not add a smoke test.

After validation, require the same `HEAD` and a clean worktree. A failed,
incomplete, or state-changing validation returns actionable findings to
`/work` and stops.

### 5. Assess Readiness Against the Plan

Resolve the request target branch to its locally known target ref and read the
complete diff from the merge base through the exact `HEAD`. Stop in `/ready`
with a manual action when the target ref cannot be resolved; do not fetch or
guess another target.

Select and activate the most appropriate specialist by following
`./sub-agent.md`. Give it only:

- the plan Objective and Expected Outcome;
- the complete diff;
- the global-validation evidence;
- the instruction to remain read-only and return exactly one concise verdict:
  `ready` or `not-ready`, with a short justification and concrete gaps only
  when present.

The assessment is limited to completeness and coherence with the plan. It must
not create a requirement matrix, impose point-by-point mapping, perform an
independent code review, or modify any file.

On `not-ready`, return every concrete gap to `/work` as an actionable finding
and stop. Continue only on a justified `ready` verdict.

### 6. Prepare and Preview Promotion

Prepare the exact request body using `../templates/request-description.md`,
including the official item ID and URL when both are available.
Present the complete preflight and proposed mutations using
`../templates/ready-preflight.md`, including:

- validation and readiness results;
- branch, `HEAD`, upstream ref, and ahead count;
- request ID, URL, current body and draft state;
- exact proposed body;
- push only when the branch is ahead;
- description replacement only when the body differs;
- draft removal only when the request is still draft;
- best-effort item review transition only when an official item is available.

Ask once using `../templates/select-option.md`:

```text
question: Push this branch and promote its request for review?
options:
- Confirm push and promotion
- Stop without changes
```

On `Stop without changes`, perform no mutation and stop. Do not push or call a
provider mutation without `Confirm push and promotion`.

### 7. Push and Promote

After confirmation, require `HEAD` to still equal the previewed SHA. If it
changed, return to the preflight and require a new preview and confirmation.

When the branch is ahead, push the current `HEAD` to its configured upstream
with a normal non-force push. Never force, create another branch, or push
another ref. Read the exact remote branch ref and require its SHA to equal
`HEAD`. On push, authentication, or remote verification failure, stop in
`/ready` and report the exact achieved and remaining actions.

Run `../commands/update-request.md` with:

```text
provider: resolved version provider
repository: repository derived from the push remote
request_id: resolved request ID
action: replace-description
body: exact prepared body
```

A body already applied succeeds without mutation. On
`unsupported`, present the exact body and instruct the user to apply it
manually, then stop until a rerun verifies it. On `failed`, stop with achieved
and remaining actions.

Run `../commands/update-request.md` with:

```text
provider: resolved version provider
repository: repository derived from the push remote
request_id: resolved request ID
action: mark-ready
```

A request already out of draft succeeds without mutation. On `unsupported`,
instruct the user to remove draft state manually, then stop until a rerun
verifies it. On `failed`, stop with achieved and remaining actions.

When official item context is available, resolve its configured provider with
`../commands/resolve-item-provider.md` using `context: item`, then run
`../commands/transition-item-status.md` with:

```text
provider: resolved item provider
item_id: official item ID
target_status: review
```

Record its best-effort report. Whether transitioned or not, continue; item
status never blocks request promotion.

### 8. Verify and Report

Verify again that the exact remote branch ref equals `HEAD`. Read the exact
request again and require it to be open, on the current source branch, with the
exact prepared body and `draft: false`.

Present the final state with `../templates/ready-result.md`, including the item
review report when attempted. On partial failure, list only state already
achieved and actions still required. A rerun relies on the same final-state
checks and the idempotent request mutations; do not invent recovery state or
retry automatically.

Stop. Do not invoke `/review`.

---

## Safety

- Never mutate external state before the single explicit confirmation.
- Never force-push, merge, deploy, release, or invoke `/review`.
- Never run smoke tests or add checks not present in the plan Validation.
- Never search for or create a replacement request.
- Never modify the plan, code, commits, item content, or unrelated provider
  fields.
- Keep code, plan, coherence, and validation findings actionable for `/work`.
- Keep Git remote, provider, authentication, access, and request failures in
  `/ready` with an exact manual or retry action.
- Treat the optional item review transition as best-effort and non-blocking.

---

## Success Criteria

`/ready` succeeds when:

- the plan is terminal and its global validation passes at the exact `HEAD`;
- the complete diff receives a justified `ready` verdict against Objective and
  Expected Outcome;
- the user explicitly confirmed before mutation;
- the remote work-branch ref equals `HEAD`;
- the exact open request has the prepared body and is not draft;
- the optional item review transition was attempted and reported;
- the workflow stopped without smoke tests or invoking `/review`.
