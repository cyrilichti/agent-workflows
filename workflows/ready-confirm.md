# Ready Execution Branch

## Steps

### 1. Verify the Delivery

Require the authoritative plan file, Objective, Expected Outcome, todos, and
global Validation. Derive its canonical reference from its project-relative
path. Every todo must be terminal and at least one must be `completed`.

Inspect the current branch without fetching. Require a clean named non-default
branch with an upstream that is not behind or diverged. Keep the branch, `HEAD`,
push remote, upstream, and ahead count.

Resolve the configured version provider, repository, and exact open request for
the current branch with `../commands/resolve-version-provider.md`,
`../commands/resolve-version-repository.md`, and
`../commands/resolve-request.md`. Reuse the request identity or official item
backlinks from the delivery context; ask for its number or IID only when neither
is available. Never search for or substitute another request.

Run only the plan's global Validation. Compare the complete committed diff
against the request target with the Objective and Expected Outcome. Check only
that the planned outcome was delivered: do not select a specialist or perform
a code review.

For every validation failure or concrete delivery gap, create one stable
finding ID and preserve its exact explanation with the verified local HEAD SHA.
Return all findings in `delivery_context.source_findings`, then follow
`./work.md` in resumed caller mode. Do not modify the plan in `/ready`.

### 2. Recheck and Push

Require the same branch and HEAD with a clean worktree. Restart verification if
they changed. Push normally to the configured upstream only when ahead, then
read the exact request with `fields: delivery_state` and require its head SHA to
equal the verified local HEAD.

### 3. Publish the Plan and Promote

Prepare the exact request body with `../templates/request-description.md` and
the exact plan comment with `../templates/request-plan-comment.md`.

Create or update the single plan comment through
`../commands/sync-request-plan-comment.md`, preserving its returned identity in
the delivery context. Update the exact request description, then mark it ready
through `../commands/update-request.md`. Stop on any failed, unsupported, or
unobserved required mutation.

Read the exact request with `fields: delivery_state`. Require it to be open,
non-draft, and still at the verified HEAD before continuing.

When official item context is available, resolve its provider and run
`../commands/transition-item-status.md` with `target_status: review`
best-effort; this never blocks request promotion.

### 4. Continue to Inspect

Follow `./inspect.md` in caller mode with the complete delivery context and the
observed non-draft request. Do not ask another question.

## Safety

- Do not modify work, force-push, merge, or add checks.
- Keep work gaps in `/work` and operational failures in `/ready`.
- Do not promote or inspect an unpushed or unobserved HEAD.
